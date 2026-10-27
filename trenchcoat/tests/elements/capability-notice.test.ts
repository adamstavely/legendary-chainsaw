/*
 * <tc-capability-notice> in real browsers: the host and both looks, the two levels and their wording, the task area,
 * the cap and who was notified, the folded distance detail (disclosure, cancelable tc-open-change, the meter and its
 * scale), text as properties, the React wrapper (controlled and not) and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/capability-notice";
import type { TcCapabilityNotice } from "../../src/elements/capability-notice";
import { CapabilityNotice } from "../../src/elements/react/capability-notice";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const notice = (look = "standard", level = "partial") =>
  fixture<TcCapabilityNotice>(html`<tc-capability-notice look=${look} level=${level} area="Tax rules outside the UK" cap="Medium" notified="Supervisor" distance="0.72" usual="0.45"></tc-capability-notice>`);

describe("tc-capability-notice", () => {
  for (const look of looks) {
    test(`${look}: a note named by its heading, with the level, area, cap and who was notified`, async () => {
      const el = await notice(look);
      expect(el.dataset.ui).toBe("cpn");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("note");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Check this answer independently");
      expect(el.querySelector(".ui-cpn__level")!.textContent).toBe("Partly proven");
      expect(plain(el.querySelector(".ui-cpn__area")!.textContent)).toBe("Task area Tax rules outside the UK");
      expect(el.querySelector(".ui-cpn__message")!.textContent).toBe("The AI has only been partly validated on requests like this one, so its answer may sound surer than it is.");
      expect([...el.querySelectorAll(".ui-cpn__fact")].map((f) => plain(f.textContent))).toEqual(["Confidence capped at Medium", "Supervisor notified"]);
      // A notice, not a card: no card header
      expect(el.querySelector(".tc-head")).toBeNull();
    });
  }

  test("unproven: red, its own wording", async () => {
    const el = await notice("standard", "unproven");
    expect(el.getAttribute("level")).toBe("unproven");
    expect(el.querySelector(".ui-cpn__level")!.textContent).toBe("Not proven");
    expect(el.querySelector(".ui-cpn__title")!.textContent).toBe("Treat this answer as a starting point");
    expect(getComputedStyle(el).getPropertyValue("--tc-capability-notice-fg").trim()).toBe(getComputedStyle(el).getPropertyValue("--tc-status-danger-fg").trim());
    // An unknown level reads as partial
    el.level = "nonsense" as never;
    await settle();
    expect(el.querySelector(".ui-cpn__level")!.textContent).toBe("Partly proven");
  });

  test("without a cap, a notified person or a distance, those parts don't show", async () => {
    const el = await fixture<TcCapabilityNotice>(html`<tc-capability-notice></tc-capability-notice>`);
    expect(el.querySelector(".ui-cpn__facts")).toBeNull();
    expect(el.querySelector(".ui-cpn__area")).toBeNull();
    expect(el.querySelector(".ui-cpn__fold")).toBeNull();
    el.cap = "Low";
    await settle();
    expect([...el.querySelectorAll(".ui-cpn__fact")].map((f) => plain(f.textContent))).toEqual(["Confidence capped at Low"]);
  });

  test("the distance detail is a disclosure; tc-open-change is cancelable", async () => {
    const el = await notice();
    const btn = el.querySelector<HTMLButtonElement>(".ui-cpn__toggle")!;
    const detail = el.querySelector<HTMLElement>(".ui-cpn__detail")!;
    expect(plain(btn.textContent)).toBe("Distance from usual 0.72");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.getAttribute("aria-controls")).toBe(detail.id);
    expect(detail.hidden).toBe(true);
    const seen: boolean[] = [];
    el.addEventListener("tc-open-change", (e) => seen.push((e as CustomEvent).detail.open));
    btn.click();
    await settle();
    expect(el.open).toBe(true);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(detail.hidden).toBe(false);
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-open-change", stop);
    btn.click();
    await settle();
    expect(el.open).toBe(true);
    expect(seen).toEqual([true, false]);
  });

  test("the scale is a meter: the score, the usual range and the threshold", async () => {
    const el = await notice();
    el.open = true;
    await settle();
    const meter = el.querySelector<HTMLElement>('[role="meter"]')!;
    expect(meter.getAttribute("aria-label")).toBe("Distance from usual");
    expect([meter.getAttribute("aria-valuemin"), meter.getAttribute("aria-valuemax"), meter.getAttribute("aria-valuenow")]).toEqual(["0", "1", "0.72"]);
    expect(meter.getAttribute("aria-valuetext")).toBe("0.72 – above the usual range, up to 0.45");
    expect(el.querySelector<HTMLElement>(".ui-cpn__usual")!.style.inlineSize).toBe("45%");
    expect(el.querySelector<HTMLElement>(".ui-cpn__dot")!.style.insetInlineStart).toBe("72%");
    expect(el.querySelector(".ui-cpn__dot")!.hasAttribute("data-beyond")).toBe(true);
    expect(plain(el.querySelector(".ui-cpn__usual-label")!.textContent)).toBe("usual ≤ 0.45");
    el.distance = 0.3;
    el.scaleMax = 2;
    el.digits = 1;
    await settle();
    expect(meter.getAttribute("aria-valuetext")).toBe("0.3 – within the usual range, up to 0.5");
    expect(el.querySelector<HTMLElement>(".ui-cpn__dot")!.style.insetInlineStart).toBe("15%");
    // Off the scale: the dot stays at the end, the value is clamped
    el.distance = 5;
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-cpn__dot")!.style.insetInlineStart).toBe("100%");
    expect(meter.getAttribute("aria-valuenow")).toBe("2");
    // Without a threshold: no usual range
    el.usual = undefined;
    await settle();
    expect(el.querySelector(".ui-cpn__usual")).toBeNull();
    expect(meter.getAttribute("aria-valuetext")).toBe("5.0");
  });

  test("text is properties", async () => {
    const el = await notice();
    el.heading = "Verify before sending";
    el.message = "Few examples like this one were reviewed.";
    el.distanceLabel = "Novelty";
    el.distanceNote = "";
    el.open = true;
    await settle();
    expect(el.querySelector(".ui-cpn__title")!.textContent).toBe("Verify before sending");
    expect(el.querySelector(".ui-cpn__message")!.textContent).toBe("Few examples like this one were reviewed.");
    expect(el.querySelector('[role="meter"]')!.getAttribute("aria-label")).toBe("Novelty");
    expect(el.querySelector(".ui-cpn__note")).toBeNull();
  });

  test("the wrapper: title, and open controlled or not", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: boolean[] = [];
    await act(async () => root.render(React.createElement(CapabilityNotice, { title: "Heads up", distance: 0.6, usual: 0.4, onOpenChange: (o) => calls.push(o) })));
    await settle();
    const el = host.querySelector("tc-capability-notice")!;
    expect(el.querySelector(".ui-cpn__title")!.textContent).toBe("Heads up");
    el.querySelector<HTMLButtonElement>(".ui-cpn__toggle")!.click();
    await settle();
    expect(el.open).toBe(true);
    // Uncontrolled: a parent re-render keeps it open
    await act(async () => root.render(React.createElement(CapabilityNotice, { title: "Heads up again", distance: 0.6, usual: 0.4, onOpenChange: (o) => calls.push(o) })));
    await settle();
    expect(el.open).toBe(true);
    // Controlled: the click is reported, the value stays the parent's
    await act(async () => root.render(React.createElement(CapabilityNotice, { open: false, distance: 0.6, onOpenChange: (o) => calls.push(o) })));
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-cpn__toggle")!.click();
    await settle();
    expect(el.open).toBe(false);
    expect(calls).toEqual([true, true]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look or level (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-capability-notice area="A" cap="Medium" notified="Supervisor" distance="0.7" usual="0.45" open></tc-capability-notice>
        <tc-capability-notice level="unproven" area="B" cap="Low" distance="0.9" usual="0.45" open></tc-capability-notice>
        <tc-capability-notice look="clean" area="C" cap="Medium" notified="Team lead" distance="0.3" usual="0.45" open></tc-capability-notice>
        <tc-capability-notice look="clean" level="unproven" distance="0.9"></tc-capability-notice>
      </div>`);
      await wait(400);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
