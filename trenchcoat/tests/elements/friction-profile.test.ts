/*
 * <tc-friction-profile> in real browsers: the host and both looks, the mode switch (a radio group from the modes as
 * data, arrow keys preview), each safeguard's state under the shown mode, the preview's diff against the mode in force,
 * Keep and Escape, Apply and its cancelable tc-mode-change (and controlled use), deadline mode's reason and end time
 * (validation and focus), the helpers, the React wrapper and axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/friction-profile";
import { FRICTION_MODES, frictionChanges, type FrictionSafeguard, type TcFrictionProfile } from "../../src/elements/friction-profile";
import { FrictionProfile } from "../../src/elements/react/friction-profile";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const SAFEGUARDS: FrictionSafeguard[] = [
  {
    id: "intent",
    label: "Intent check",
    description: "Two short questions before the first answer",
    modes: { elevated: { state: "tightened", change: "Adds a third question on what would change your mind" }, deadline: { state: "shortened", change: "One question instead of two" } },
  },
  { id: "queue", label: "Verification queue", description: "Unchecked claims wait in a queue", modes: { deadline: { state: "deferred", change: "Checked after the deadline, not before" } } },
  { id: "export", label: "Export review", modes: { elevated: { state: "tightened", change: "A second person signs off" }, deadline: { state: "tightened", change: "Unverified high-confidence claims block export" } } },
  { id: "nudges", label: "Reflection prompts", modes: { deadline: { state: "off", change: "Paused until the deadline passes" } } },
];
const profile = (o: { look?: string; mode?: string } = {}) =>
  fixture<TcFrictionProfile>(html`<tc-friction-profile look=${o.look ?? "standard"} scope="This session" mode=${o.mode ?? "standard"} .safeguards=${SAFEGUARDS}></tc-friction-profile>`);
const radios = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
const pick = async (el: Element, label: string) => {
  radios(el)
    .find((r) => r.textContent!.includes(label))!
    .click();
  await settle();
};
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-frp__item")];
const apply = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-frp__btn--primary");

describe("tc-friction-profile", () => {
  for (const look of looks) {
    test(`${look}: the host is the root and a region named by its heading; the switch follows the look`, async () => {
      const el = await profile({ look });
      expect(el.dataset.ui).toBe("frp");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Friction profile");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("This session");
      expect(!!el.querySelector(".ui-frp__card .tc-head")).toBe(look === "clean");
      expect(el.querySelector<HTMLElement>("tc-segmented-control")!.dataset.look).toBe(look);
      expect(el.querySelector(".ui-frp__pill")!.textContent).toBe("Standard");
      expect(plain(el.querySelector(".ui-frp__status")!.textContent)).toBe("In force: Standard");
      expect(el.querySelector(".ui-frp__actions")).toBeNull();
    });
  }

  test("the switch: a radio group named Mode, one radio per mode, described by the mode's line", async () => {
    const el = await profile();
    const group = el.querySelector<HTMLElement>('[role="radiogroup"]')!;
    expect(group.getAttribute("aria-label")).toBe("Mode");
    expect(radios(el).map((r) => r.textContent!.trim())).toEqual(["Standard", "Elevated", "Deadline"].map((l) => expect.stringContaining(l)) as unknown as string[]);
    expect(radios(el).map((r) => r.getAttribute("aria-checked"))).toEqual(["true", "false", "false"]);
    expect(el.querySelector(".ui-frp__mode-desc")!.textContent!.trim()).toBe("Every safeguard works as usual.");
    // Modes are data
    el.modes = [FRICTION_MODES[0], { id: "audit", label: "Audit", description: "Everything logged" }];
    el.safeguards = [{ id: "log", label: "Logging", modes: { audit: { state: "tightened" } } }];
    await settle();
    expect(radios(el).length).toBe(2);
    await pick(el, "Audit");
    expect(el.querySelector<HTMLElement>(".ui-frp__item")!.dataset.state).toBe("tightened");
  });

  test("each safeguard shows its state under the mode, with what it does or what changes", async () => {
    const el = await profile();
    expect(rows(el).map((r) => r.dataset.state)).toEqual(["on", "on", "on", "on"]);
    expect(rows(el).map((r) => r.querySelector(".ui-frp__change")?.textContent ?? null)).toEqual(["Two short questions before the first answer", "Unchecked claims wait in a queue", null, null]);
    expect(el.querySelector(".ui-frp__list")!.getAttribute("aria-label")).toBe("Safeguards under Standard");
    expect(el.querySelector(".ui-frp__diff")).toBeNull();
    expect(el.querySelector(".ui-frp__item[data-change]")).toBeNull();
  });

  test("picking a mode previews it: from → to on changed rows, the diff, nothing applied", async () => {
    const el = await profile();
    await pick(el, "Deadline");
    expect(el.mode).toBe("standard");
    expect(el.hasAttribute("data-previewing")).toBe(true);
    expect(el.querySelector(".ui-frp__pill")!.textContent).toBe("Standard");
    expect(plain(el.querySelector(".ui-frp__mode-desc")!.textContent)).toBe("Preview Under time pressure: quicker to start, stricter to finish.");
    expect(rows(el).map((r) => r.dataset.state)).toEqual(["shortened", "deferred", "tightened", "off"]);
    expect(rows(el).map((r) => r.dataset.change)).toEqual(["eased", "eased", "tighter", "eased"]);
    const first = rows(el)[0];
    expect([...first.querySelectorAll(".ui-frp__state")].map((s) => s.textContent)).toEqual(["On", "Shortened"]);
    expect(first.querySelector(".ui-frp__sr")!.textContent).toBe(", On now, Shortened in Deadline");
    expect(first.querySelector(".ui-frp__change")!.textContent).toBe("One question instead of two");
    expect(plain(el.querySelector(".ui-frp__diff")!.textContent)).toBe("Compared with Standard: 3 eased 1 tighter 0 unchanged");
    expect(plain(el.querySelector(".ui-frp__status")!.textContent)).toBe("4 safeguards change");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Previewing Deadline: 4 safeguards change.");
    expect(el.querySelector(".ui-frp__list")!.getAttribute("aria-label")).toBe("Safeguards under Deadline");
    // Elevated: two tighter, two unchanged
    await pick(el, "Elevated");
    expect(plain(el.querySelector(".ui-frp__diff")!.textContent)).toBe("Compared with Standard: 2 tighter 2 unchanged");
    expect(el.querySelector(".ui-frp__fields")).toBeNull();
    // The helper agrees
    expect(frictionChanges(SAFEGUARDS, "standard", "elevated")).toEqual([
      { id: "intent", from: "on", to: "tightened" },
      { id: "export", from: "on", to: "tightened" },
    ]);
  });

  test("arrow keys preview the next mode; Keep and Escape return to the mode in force", async () => {
    const el = await profile();
    const r = radios(el);
    r[0].focus();
    r[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    await settle();
    expect(radios(el)[1].getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(radios(el)[1]);
    expect(el.hasAttribute("data-previewing")).toBe(true);
    // The inner control's event doesn't reach the page
    const outer: string[] = [];
    document.body.addEventListener("tc-value-change", () => outer.push("leak"));
    radios(el)[1].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
    await settle();
    expect(outer).toEqual([]);
    expect(radios(el)[2].getAttribute("aria-checked")).toBe("true");
    radios(el)[2].dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await settle();
    expect(el.hasAttribute("data-previewing")).toBe(false);
    expect(radios(el)[0].getAttribute("aria-checked")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Kept Standard.");
    await pick(el, "Elevated");
    el.querySelector<HTMLButtonElement>(".ui-frp__btn--ghost")!.click();
    await settle();
    expect(el.hasAttribute("data-previewing")).toBe(false);
    expect(rows(el).every((r) => r.dataset.state === "on")).toBe(true);
  });

  test("Apply fires a cancelable tc-mode-change with the changes; unprevented, the mode is in force", async () => {
    const el = await profile();
    await pick(el, "Elevated");
    expect(apply(el)!.textContent!.trim()).toBe("Apply Elevated");
    expect(el.querySelector<HTMLButtonElement>(".ui-frp__btn--ghost")!.textContent!.trim()).toBe("Keep Standard");
    const seen: unknown[] = [];
    el.addEventListener("tc-mode-change", (e) => seen.push((e as CustomEvent).detail));
    apply(el)!.click();
    await settle();
    expect(seen).toEqual([
      {
        mode: "elevated",
        previous: "standard",
        reason: "",
        until: "",
        changes: [
          { id: "intent", from: "on", to: "tightened" },
          { id: "export", from: "on", to: "tightened" },
        ],
      },
    ]);
    expect(el.mode).toBe("elevated");
    expect(el.querySelector(".ui-frp__pill")!.textContent).toBe("Elevated");
    expect(el.querySelector(".ui-frp__pill")!.getAttribute("data-tone")).toBe("info");
    expect(el.hasAttribute("data-previewing")).toBe(false);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Elevated applied. 2 safeguards changed.");
    // Now the diff is against Elevated
    await pick(el, "Standard");
    expect(plain(el.querySelector(".ui-frp__diff")!.textContent)).toBe("Compared with Elevated: 2 eased 2 unchanged");
  });

  test("deadline mode needs a reason and an end time: Apply marks what's missing and focuses it", async () => {
    const el = await profile();
    await pick(el, "Deadline");
    expect(el.querySelector(".ui-frp__fields-note")!.textContent).toBe("Deadline needs a reason and an end time before it's applied.");
    const reason = el.querySelector<HTMLInputElement>('input[type="text"]')!;
    const until = el.querySelector<HTMLInputElement>('input[type="datetime-local"]')!;
    expect(el.querySelector(`label[for="${reason.id}"]`)!.textContent).toBe("Why");
    expect(el.querySelector(`label[for="${until.id}"]`)!.textContent).toBe("Until");
    expect(reason.getAttribute("aria-required")).toBe("true");
    const seen: unknown[] = [];
    el.addEventListener("tc-mode-change", (e) => seen.push((e as CustomEvent).detail));
    apply(el)!.click();
    await settle();
    expect(seen).toEqual([]);
    expect(reason.getAttribute("aria-invalid")).toBe("true");
    expect(until.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(reason.getAttribute("aria-describedby")!)!.textContent).toBe("Say why deadline mode is needed.");
    expect(document.getElementById(until.getAttribute("aria-describedby")!)!.textContent).toBe("Choose when deadline mode ends.");
    expect(document.activeElement).toBe(reason);
    reason.value = "Filing due at 5 pm";
    reason.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(reason.getAttribute("aria-invalid")).toBe("false");
    apply(el)!.click();
    await settle();
    expect(document.activeElement).toBe(until);
    until.value = "2026-10-27T17:00";
    until.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    apply(el)!.click();
    await settle();
    expect(seen.length).toBe(1);
    expect(seen[0]).toMatchObject({ mode: "deadline", reason: "Filing due at 5 pm", until: "2026-10-27T17:00" });
    expect(el.mode).toBe("deadline");
    expect(el.reason).toBe("Filing due at 5 pm");
    expect(el.until).toBe("2026-10-27T17:00");
    expect(el.querySelector(".ui-frp__fields")).toBeNull();
    expect(plain(el.querySelector(".ui-frp__status")!.textContent)).toMatch(/^In force: Deadline until Oct 27, 2026,? (at )?5:00 PM · Filing due at 5 pm$/);
    // Going back asks nothing, and the reason and end time clear
    await pick(el, "Standard");
    expect(el.querySelector(".ui-frp__fields")).toBeNull();
    apply(el)!.click();
    await settle();
    expect(el.mode).toBe("standard");
    expect(el.reason).toBe("");
    expect(el.until).toBe("");
  });

  test("controlled: preventDefault keeps the mode in force; a new mode from the app ends the preview", async () => {
    const el = await profile();
    el.addEventListener("tc-mode-change", (e) => e.preventDefault());
    await pick(el, "Elevated");
    apply(el)!.click();
    await settle();
    expect(el.mode).toBe("standard");
    expect(el.hasAttribute("data-previewing")).toBe(true);
    el.mode = "elevated";
    await settle();
    expect(el.hasAttribute("data-previewing")).toBe(false);
    expect(el.querySelector(".ui-frp__pill")!.textContent).toBe("Elevated");
    // State names are properties
    el.stateLabels = { tightened: "Stricter" };
    await settle();
    expect(rows(el)[0].querySelector(".ui-frp__state")!.textContent).toBe("Stricter");
    // No safeguards
    el.safeguards = [];
    await settle();
    expect(el.querySelector(".ui-frp__empty")!.textContent).toBe("No safeguards to show.");
  });

  test("the wrapper: an uncontrolled mode survives a parent re-render; controlled only reports", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: unknown[] = [];
    let rerender!: (n: number) => void;
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(FrictionProfile, { title: `Safeguards ${n}`, safeguards: SAFEGUARDS, onModeChange: (c) => calls.push([c.mode, c.previous]) });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-friction-profile")!;
    await pick(el, "Elevated");
    apply(el)!.click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(el.querySelector("h3")!.textContent).toBe("Safeguards 1");
    expect(el.mode).toBe("elevated");
    expect(calls).toEqual([["elevated", "standard"]]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(FrictionProfile, { safeguards: SAFEGUARDS, mode: "standard", onModeChange: (c) => calls.push(c.mode) })));
    await settle();
    const el2 = host2.querySelector("tc-friction-profile")!;
    await pick(el2, "Elevated");
    apply(el2)!.click();
    await act(async () => settle());
    expect(el2.mode).toBe("standard");
    expect(calls.at(-1)).toBe("elevated");
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10" : ""}>
        <tc-friction-profile scope="In force" .safeguards=${SAFEGUARDS}></tc-friction-profile>
        <tc-friction-profile heading="Deadline" mode="deadline" reason="Filing" until="2026-10-27T17:00" .safeguards=${SAFEGUARDS}></tc-friction-profile>
        <tc-friction-profile look="clean" heading="Clean" mode="elevated" .safeguards=${SAFEGUARDS}></tc-friction-profile>
        <tc-friction-profile look="clean" heading="Empty"></tc-friction-profile>
      </div>`);
      // Previews: deadline (with its fields, marked missing) in the first, standard in the third
      const [a, , c] = wrap.querySelectorAll("tc-friction-profile");
      await pick(a, "Deadline");
      apply(a)!.click();
      await pick(c, "Standard");
      await settle();
      await wait(500);
      document.getAnimations().forEach((x) => x.effect?.getTiming().iterations !== Infinity && x.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
