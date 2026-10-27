/*
 * <tc-kill-switch> in real browsers: posture, what's running, the confirmation dialog (focus in, trapped, restored),
 * tc-stop and tc-resume, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/kill-switch";
import type { KillResumeEvent, KillRunning, KillStop, KillStopEvent, TcKillSwitch } from "../../src/elements/kill-switch";
import { KillSwitch } from "../../src/elements/react/kill-switch";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const running: KillRunning[] = [
  { id: "support", label: "Support agent", kind: "Agent", detail: "14 conversations" },
  { id: "billing", label: "Billing agent", detail: "2 refunds" },
  { id: "sync", label: "Nightly sync", kind: "Schedule" },
];
const BILLING: KillStop = { id: "s-1", target: "billing", label: "Billing agent", by: "Priya", at: "09:42", reason: "Refund policy" };

const make = (look: "standard" | "clean" = "standard", stops: KillStop[] = []) =>
  fixture<TcKillSwitch>(html`<tc-kill-switch look=${look} .running=${running} .stops=${stops}></tc-kill-switch>`);
const stopAll = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-ks__stop-all")!;
const stopBtn = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-focus-key="stop:${id}"]`);
const dialog = (el: Element) => el.querySelector<HTMLDialogElement>(".ui-ks__dialog")!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const finish = async (root: Element) => {
  for (const a of root.getAnimations?.({ subtree: true }) ?? []) a.finish();
  await settle();
};

describe("tc-kill-switch", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host, the posture and what's running`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("ks");
      expect(el.dataset.look).toBe(look);
      expect(el.dataset.posture).toBe("normal");
      // The header first (on the tray in Standard, the card's first row in Clean), the posture pill at its right
      expect(el.querySelector(":scope > .ui-ks__sr + .tc-head + .ui-ks__card")).toBeTruthy();
      expect(el.querySelector(".tc-head__aside > .ui-ks__posture")!.textContent).toBe("Posture: Normal");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Everything is running normally.");
      const section = el.querySelector<HTMLElement>(".ui-ks__section")!;
      expect(document.getElementById(section.getAttribute("aria-labelledby")!)!.textContent).toBe("Running3");
      expect([...el.querySelectorAll(".ui-ks__item-name")].map((n) => n.textContent)).toEqual(["Support agentAgent", "Billing agent", "Nightly syncSchedule"]);
      expect(stopBtn(el, "support")!.getAttribute("aria-label")).toBe("Stop Support agent");
      expect(stopBtn(el, "support")!.getAttribute("aria-haspopup")).toBe("dialog");
      expect(el.querySelector(".ui-ks__stop-row")).toBeNull();
    });
  }

  test("posture follows the stops unless set; a stopped item says so", async () => {
    const el = await make("standard", [BILLING]);
    expect(el.dataset.posture).toBe("elevated");
    expect(el.querySelector(".ui-ks__item[data-stopped] .ui-ks__stopped")!.textContent).toBe("Stopped");
    expect(stopBtn(el, "billing")).toBeNull();
    expect(el.querySelector(".ui-ks__stop-row .ui-ks__item-detail")!.textContent).toBe("By Priya · 09:42 · Refund policy");
    el.stops = [{ id: "s-2", target: "all", label: "Everything", at: new Date(2026, 9, 24, 14, 5) }];
    await settle();
    expect(el.dataset.posture).toBe("stopped");
    expect(stopAll(el).getAttribute("aria-disabled")).toBe("true");
    expect(el.querySelectorAll(".ui-ks__item[data-stopped]")).toHaveLength(3);
    expect(el.querySelector(".ui-ks__stop-row .ui-ks__item-detail")!.textContent).toMatch(/(14|0?2).05/);
    el.posture = "elevated";
    el.postureNote = "Unusual tool use flagged";
    el.postureLabels = { elevated: "Watch" };
    await settle();
    expect(el.dataset.posture).toBe("elevated");
    expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Unusual tool use flagged");
    expect(el.querySelector(".ui-ks__posture")!.textContent).toBe("Posture: Watch");
    // A disabled Stop everything doesn't open anything
    el.posture = undefined;
    await settle();
    stopAll(el).click();
    await settle();
    expect(dialog(el).open).toBe(false);
  });

  test("Stop everything: a modal names what it halts, focus starts on Cancel and is trapped; Escape cancels and restores focus", async () => {
    const el = await make("standard", [BILLING]);
    stopAll(el).focus();
    stopAll(el).click();
    await settle();
    const d = dialog(el);
    expect(d.open).toBe(true);
    expect(d.getAttribute("role")).toBe("alertdialog");
    expect(document.getElementById(d.getAttribute("aria-labelledby")!)!.textContent).toBe("Stop everything?");
    const desc = document.getElementById(d.getAttribute("aria-describedby")!)!;
    // Only what's still running – the billing agent is already stopped
    expect([...desc.querySelectorAll(".ui-ks__halt-name")].map((n) => n.textContent)).toEqual(["Support agent", "Nightly sync"]);
    expect(desc.querySelector(".ui-ks__dlg-lead")!.textContent).toBe("This halts 2 items:");
    expect(document.activeElement).toBe(d.querySelector(".ui-ks__cancel"));
    // Tab wraps: from Stop to the reason field, and Shift+Tab from the field to Stop
    const confirmBtn = d.querySelector<HTMLButtonElement>(".ui-ks__confirm")!;
    confirmBtn.focus();
    key(confirmBtn, "Tab");
    expect(document.activeElement).toBe(d.querySelector(".ui-ks__reason"));
    key(document.activeElement!, "Tab", { shiftKey: true });
    expect(document.activeElement).toBe(confirmBtn);
    key(confirmBtn, "Escape");
    await settle();
    expect(d.open).toBe(false);
    expect(document.activeElement).toBe(stopAll(el));
    expect(el.stops).toEqual([BILLING]);
  });

  test("confirming a stop fires tc-stop, adds it with the reason and moves focus to its Resume; Resume fires tc-resume", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-stop", (e) => {
      const d = (e as CustomEvent<KillStopEvent>).detail;
      seen.push(["stop", d.stop.target, d.stop.reason, d.stop.by, d.halts.map((h) => h.id), d.stops.length]);
    });
    el.addEventListener("tc-resume", (e) => {
      const d = (e as CustomEvent<KillResumeEvent>).detail;
      seen.push(["resume", d.stop.target, d.stops.length]);
    });
    stopBtn(el, "support")!.click();
    await settle();
    expect(document.getElementById(dialog(el).getAttribute("aria-labelledby")!)!.textContent).toBe("Stop Support agent?");
    const reason = dialog(el).querySelector<HTMLTextAreaElement>(".ui-ks__reason")!;
    reason.value = "Answers look wrong";
    reason.dispatchEvent(new Event("input", { bubbles: true }));
    dialog(el).querySelector<HTMLButtonElement>(".ui-ks__confirm")!.click();
    await settle();
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(el.stops).toHaveLength(1);
    expect(el.dataset.posture).toBe("elevated");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Stopped: Support agent");
    const resume = el.querySelector<HTMLButtonElement>(".ui-ks__resume")!;
    expect(document.activeElement).toBe(resume);
    expect(resume.getAttribute("aria-label")).toBe("Resume Support agent");
    expect(el.querySelector(".ui-ks__stop-row .ui-ks__item-detail")!.textContent).toBe("By you · Answers look wrong");
    resume.click();
    await settle();
    await settle();
    expect(el.stops).toEqual([]);
    expect(el.dataset.posture).toBe("normal");
    // Focus goes back to the item's Stop
    expect(document.activeElement).toBe(stopBtn(el, "support"));
    expect(seen).toEqual([
      ["stop", "support", "Answers look wrong", "You", ["support"], 1],
      ["resume", "support", 0],
    ]);
  });

  test("require-reason: Stop needs a reason first", async () => {
    const el = await make();
    el.requireReason = true;
    await settle();
    stopAll(el).click();
    await settle();
    dialog(el).querySelector<HTMLButtonElement>(".ui-ks__confirm")!.click();
    await settle();
    const reason = dialog(el).querySelector<HTMLTextAreaElement>(".ui-ks__reason")!;
    expect(dialog(el).open).toBe(true);
    expect(reason.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(reason);
    expect(el.stops).toEqual([]);
    reason.value = "Incident 42";
    reason.dispatchEvent(new Event("input", { bubbles: true }));
    dialog(el).querySelector<HTMLButtonElement>(".ui-ks__confirm")!.click();
    await settle();
    expect(el.stops[0]).toMatchObject({ target: "all", label: "Everything", reason: "Incident 42" });
    expect(el.dataset.posture).toBe("stopped");
  });

  test("controlled: preventDefault() keeps the stops; Cancel closes without a stop", async () => {
    const el = await make("clean", [BILLING]);
    el.addEventListener("tc-stop", (e) => e.preventDefault());
    el.addEventListener("tc-resume", (e) => e.preventDefault());
    stopBtn(el, "sync")!.click();
    await settle();
    dialog(el).querySelector<HTMLButtonElement>(".ui-ks__confirm")!.click();
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(el.stops).toEqual([BILLING]);
    el.querySelector<HTMLButtonElement>(".ui-ks__resume")!.click();
    await settle();
    expect(el.stops).toEqual([BILLING]);
    stopBtn(el, "sync")!.click();
    await settle();
    dialog(el).querySelector<HTMLButtonElement>(".ui-ks__cancel")!.click();
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(document.activeElement).toBe(stopBtn(el, "sync"));
  });

  test("nothing running: says so, and the dialog says new work won't start", async () => {
    const el = await fixture<TcKillSwitch>(html`<tc-kill-switch></tc-kill-switch>`);
    expect(el.querySelector(".ui-ks__none")!.textContent).toBe("Nothing is running.");
    stopAll(el).click();
    await settle();
    expect(dialog(el).querySelector(".ui-ks__dlg-lead")!.textContent).toContain("Nothing is running right now");
  });

  test("React wrapper: uncontrolled stops survive parent re-renders; callbacks fire", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(KillSwitch, {
        title: "Agents",
        running,
        defaultStops: [BILLING],
        onStop: (s, h) => void seen.push(["stop", s.target, h.length]),
        onResume: (s) => void seen.push(["resume", s.target]),
        onStopsChange: (s) => void seen.push(["change", s.length]),
        "data-n": n,
      } as React.ComponentProps<typeof KillSwitch>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-kill-switch")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Agents");
    stopBtn(el, "sync")!.click();
    await settle();
    dialog(el).querySelector<HTMLButtonElement>(".ui-ks__confirm")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.querySelectorAll(".ui-ks__stop-row")).toHaveLength(2);
    el.querySelector<HTMLButtonElement>(".ui-ks__resume")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.querySelectorAll(".ui-ks__stop-row")).toHaveLength(1);
    expect(seen).toEqual([
      ["change", 2],
      ["stop", "sync", 1],
      ["change", 1],
      ["resume", "billing"],
    ]);
    await act(async () => root.unmount());
  });

  test("React wrapper: controlled stops stay until the parent changes them", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: KillStop[][] = [];
    await act(async () => root.render(React.createElement(KillSwitch, { running, stops: [], onStopsChange: (s) => void asked.push(s) })));
    await settle();
    const el = host.querySelector("tc-kill-switch")!;
    stopAll(el).click();
    await settle();
    dialog(el).querySelector<HTMLButtonElement>(".ui-ks__confirm")!.click();
    await settle();
    expect(asked).toHaveLength(1);
    expect(asked[0][0].target).toBe("all");
    expect(el.querySelector(".ui-ks__stop-row")).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with the dialog open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-kill-switch .running=${running} .stops=${[BILLING]}></tc-kill-switch>
        <tc-kill-switch look="clean" .running=${running} .stops=${[{ ...BILLING, id: "s-9", target: "all", label: "Everything" }]}></tc-kill-switch>
      </div>`);
      const [a] = wrap.querySelectorAll<TcKillSwitch>("tc-kill-switch");
      stopAll(a).click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      dialog(a).close();
    });
  }
});
