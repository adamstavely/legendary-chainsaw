/*
 * <tc-publish-readiness> in real browsers: the summary (pill, meter, counts, status), the dialog and its checklist,
 * sign-offs (tc-confirmed-change), blockers (tc-open-blocker), publishing (tc-publish), opening and closing
 * (tc-open-change) with preventDefault, narrow layout, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/publish-readiness";
import type { ReadinessCheck, ReadinessConfirmedChange, ReadinessOpenBlocker, ReadinessOpenChange, TcPublishReadiness } from "../../src/elements/publish-readiness";
import type { TcProgressTracker } from "../../src/elements/progress-tracker";
import type { TcDialog } from "../../src/elements/dialog";
import { PublishReadiness } from "../../src/elements/react/publish-readiness";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const CHECKS: ReadinessCheck[] = [
  { id: "spec", label: "Spec is valid", state: "passed" },
  {
    id: "test",
    label: "Test run passed",
    detail: "run 7f2c",
    state: "failed",
    blockers: [
      { id: "b1", label: "Step 6 timed out", where: "Run 7f2c" },
      { id: "b2", label: "Summary has no source", where: "Step 8" },
    ],
  },
  { id: "owner", label: "Owner signs off", state: "manual" },
  { id: "adv", label: "Adversarial checks", detail: "run during approval", state: "pending" },
];
const READY: ReadinessCheck[] = CHECKS.map((c) => (c.state === "failed" ? { ...c, state: "passed" as const, blockers: [] } : c));

const make = (look: "standard" | "clean" = "standard", checks = CHECKS) =>
  fixture<TcPublishReadiness>(html`<tc-publish-readiness look=${look} subject="Weekly digest" version="v1.3" description="Summarises the week" note="The owner approves." .checks=${checks}></tc-publish-readiness>`);
const text = (el: Element | null) => el?.textContent!.replace(/\s+/g, " ").trim();
const tracker = (el: Element) => el.querySelector<TcProgressTracker>("tc-progress-tracker")!;
const dialog = (el: Element) => el.querySelector<TcDialog>("tc-dialog")!;
const reviewButton = (el: Element) => el.querySelector<HTMLElement>(".ui-prd__body > tc-button")!;
const publishButton = (el: Element) => el.querySelector<HTMLElement & { disabled: boolean; label: string }>(".tc-dialog-actions tc-button")!;
/** Ticks the tracker's checklist the way a click does: through its cancelable change event */
const tick = (el: Element, done: string[]) =>
  tracker(el).dispatchEvent(new CustomEvent("tc-done-change", { detail: { done, steps: [] }, bubbles: true, composed: true, cancelable: true }));

describe("tc-publish-readiness", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the summary – title with version, pill, one tick per check, counts and status`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("prd");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".tc-head__title"))).toBe("Weekly digest v1.3");
      expect(text(el.querySelector(".tc-head__sub"))).toBe("Summarises the week");
      expect(text(el.querySelector(".ui-prd__pill"))).toBe("Blocked");
      expect(el.querySelector<HTMLElement>(".ui-prd__pill")!.dataset.tone).toBe("danger");
      const meter = el.querySelector<HTMLElement>(".ui-prd__meter")!;
      expect(meter.getAttribute("role")).toBe("meter");
      expect(meter.getAttribute("aria-valuetext")).toBe("1 of 4 checks passed");
      expect([...meter.children].map((t) => (t as HTMLElement).dataset.state)).toEqual(["passed", "failed", "manual", "pending"]);
      expect(text(el.querySelector(".ui-prd__count"))).toBe("1 of 4 checks passed");
      expect(text(el.querySelector(".ui-prd__status"))).toBe("2 blockers · 1 sign-off to give");
      expect(reviewButton(el).getAttribute("label")).toBe("Review checks");
      expect(dialog(el).dataset.look).toBe(look);
      expect(dialog(el).open).toBe(false);
    });
  }

  test("the dialog: opens from the button (tc-open-change), with the checklist, checks that run later, blockers, the note and the reason it waits", async () => {
    const el = await make();
    const seen: boolean[] = [];
    el.addEventListener("tc-open-change", (e) => seen.push((e as CustomEvent<ReadinessOpenChange>).detail.open));
    reviewButton(el).click();
    await settle();
    expect(seen).toEqual([true]);
    expect(el.open).toBe(true);
    expect(dialog(el).open).toBe(true);
    expect(dialog(el).querySelector("dialog")!.open).toBe(true);
    const steps = tracker(el).steps;
    expect(steps.map((s) => [s.id, !!s.readonly, s.state ?? ""])).toEqual([
      ["spec", true, ""],
      ["test", true, "failed"],
      ["owner", false, ""],
      ["adv", true, ""],
    ]);
    expect(steps[2].icon).toBeInstanceOf(SVGElement);
    expect(tracker(el).done).toEqual(["spec"]);
    expect(text(el.querySelector(".ui-prd__eyebrow"))).toBe("Weekly digest · v1.3");
    expect(text(el.querySelector(".ui-prd__later"))).toBe("Adversarial checks – run during approval");
    expect([...el.querySelectorAll(".ui-prd__link")].map(text)).toEqual(["Step 6 timed out · Run 7f2c", "Summary has no source · Step 8"]);
    expect(text(el.querySelector(".ui-prd__note"))).toBe("The owner approves.");
    expect(text(el.querySelector(".ui-prd__why"))).toBe("Publishing waits on: 2 blockers · 1 sign-off to give");
    expect(publishButton(el).disabled).toBe(true);
    expect(publishButton(el).label).toBe("Submit for approval");
    // Escape (the dialog's cancel) closes it through the same event
    dialog(el).querySelector("dialog")!.dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();
    expect(seen).toEqual([true, false]);
    expect(el.open).toBe(false);
  });

  test("preventDefault on tc-open-change keeps the dialog as it is (controlled use)", async () => {
    const el = await make();
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    reviewButton(el).click();
    await settle();
    expect(el.open).toBe(false);
    el.open = true;
    await settle();
    expect(dialog(el).querySelector("dialog")!.open).toBe(true);
    dialog(el).querySelector("dialog")!.dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();
    expect(el.open).toBe(true);
  });

  test("signing off: tc-confirmed-change, the meter and status follow and it's announced; automated checks can't be ticked; preventDefault keeps it", async () => {
    const el = await make("standard", READY);
    el.open = true;
    await settle();
    const seen: string[][] = [];
    el.addEventListener("tc-confirmed-change", (e) => seen.push((e as CustomEvent<ReadinessConfirmedChange>).detail.confirmed));
    let inner = 0;
    document.body.addEventListener("tc-done-change", () => inner++);
    // Ticking an automated check is ignored
    tick(el, ["spec", "test", "adv"]);
    await settle();
    expect(seen).toEqual([]);
    tick(el, ["spec", "test", "owner"]);
    await settle();
    expect(inner).toBe(0);
    expect(seen).toEqual([["owner"]]);
    expect(el.confirmed).toEqual(["owner"]);
    expect(text(el.querySelector(".ui-prd__said"))).toBe("Signed off: Owner signs off");
    expect(text(el.querySelector(".ui-prd__pill"))).toBe("Ready");
    expect(text(el.querySelector(".ui-prd__status"))).toBe("Ready – 1 check runs during approval");
    expect(el.querySelector(".ui-prd__status")!.hasAttribute("data-ready")).toBe(true);
    expect(el.querySelector(".ui-prd__why")).toBeNull();
    expect(reviewButton(el).getAttribute("label")).toBe("Publish…");
    expect(reviewButton(el).getAttribute("variant")).toBe("primary");
    // Withdrawn – but the page refuses
    el.addEventListener("tc-confirmed-change", (e) => e.preventDefault(), { once: true });
    tick(el, ["spec", "test"]);
    await settle();
    expect(el.confirmed).toEqual(["owner"]);
    tick(el, ["spec", "test"]);
    await settle();
    expect(el.confirmed).toEqual([]);
    expect(text(el.querySelector(".ui-prd__said"))).toBe("Sign-off withdrawn: Owner signs off");
    expect(text(el.querySelector(".ui-prd__pill"))).toBe("Needs sign-off");
  });

  test("blockers: a link fires tc-open-blocker with the blocker and its check; plain-blockers shows text; a failed check without blockers says so", async () => {
    const el = await make();
    el.open = true;
    await settle();
    const seen: string[] = [];
    el.addEventListener("tc-open-blocker", (e) => {
      const d = (e as CustomEvent<ReadinessOpenBlocker>).detail;
      seen.push(`${d.check.id}/${d.blocker.id}`);
    });
    el.querySelectorAll<HTMLButtonElement>(".ui-prd__link")[1].click();
    expect(seen).toEqual(["test/b2"]);
    el.plainBlockers = true;
    await settle();
    expect(el.querySelectorAll(".ui-prd__link")).toHaveLength(0);
    expect([...el.querySelectorAll(".ui-prd__plain")].map(text)).toEqual(["Step 6 timed out · Run 7f2c", "Summary has no source · Step 8"]);
    el.plainBlockers = false;
    el.checks = [{ id: "x", label: "Lint", state: "failed" }];
    await settle();
    expect(el.querySelectorAll(".ui-prd__link")).toHaveLength(0);
    expect(text(el.querySelector(".ui-prd__plain"))).toBe("Fails – see the check");
    expect(text(el.querySelector(".ui-prd__status"))).toBe("1 blocker");
  });

  test("publishing: tc-publish only when ready, and not with publish-disabled", async () => {
    const el = await make("standard", READY);
    el.confirmed = ["owner"];
    el.open = true;
    await settle();
    let published = 0;
    el.addEventListener("tc-publish", () => published++);
    const button = () => publishButton(el).querySelector("button")!;
    expect(publishButton(el).disabled).toBe(false);
    button().click();
    expect(published).toBe(1);
    el.publishDisabled = true;
    await settle();
    expect(publishButton(el).disabled).toBe(true);
    el.publishDisabled = false;
    el.confirmed = [];
    await settle();
    expect(publishButton(el).disabled).toBe(true);
    expect(published).toBe(1);
  });

  test("a note or description given as an element is cloned in", async () => {
    const note = document.createElement("span");
    note.innerHTML = "<b>Who approves:</b> the owner.";
    const el = await make();
    el.note = note;
    el.open = true;
    await settle();
    expect(text(el.querySelector(".ui-prd__note"))).toBe("Who approves: the owner.");
    expect(note.isConnected).toBe(false);
  });

  test("narrow: the action goes under the summary", async () => {
    const el = await make();
    el.style.width = "320px";
    await settle();
    const summary = el.querySelector(".ui-prd__summary")!.getBoundingClientRect();
    await expect.poll(() => reviewButton(el).getBoundingClientRect().top).toBeGreaterThanOrEqual(summary.bottom - 1);
  });

  test("React wrapper: controlled confirmed and open, blockers as links only with onOpenBlocker, onPublish, a React note", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const confirmed: string[][] = [];
    const opened: boolean[] = [];
    await act(async () =>
      root.render(
        React.createElement(PublishReadiness, {
          title: "Ship it?",
          subject: "Digest",
          checks: READY,
          confirmed: [],
          onConfirmedChange: (ids) => void confirmed.push(ids),
          defaultOpen: true,
          onOpenChange: (o) => void opened.push(o),
          note: React.createElement(React.Fragment, null, React.createElement("b", null, "Who:"), " the owner"),
        }),
      ),
    );
    await settle();
    const el = host.querySelector("tc-publish-readiness")!;
    expect(dialog(el).label).toBe("Ship it?");
    expect(el.open).toBe(true);
    await expect.poll(() => text(el.querySelector(".ui-prd__note"))).toBe("Who: the owner");
    // No onPublish: the action stays off; no onOpenBlocker: plain blockers
    expect(el.publishDisabled).toBe(true);
    expect(el.plainBlockers).toBe(true);
    await act(async () => void tick(el, ["spec", "test", "owner"]));
    await settle();
    expect(confirmed).toEqual([["owner"]]);
    expect(el.confirmed).toEqual([]);
    // Uncontrolled open: closing sticks
    await act(async () => void dialog(el).querySelector("dialog")!.dispatchEvent(new Event("cancel", { cancelable: true })));
    await settle();
    expect(opened).toEqual([false]);
    expect(el.open).toBe(false);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with the dialog open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-publish-readiness subject="Weekly digest" version="v1.3" .checks=${CHECKS}></tc-publish-readiness>
        <tc-publish-readiness look="clean" subject="Daily brief" description="A summary" open .checks=${READY} note="The owner approves."></tc-publish-readiness>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
