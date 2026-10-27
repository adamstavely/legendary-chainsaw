/*
 * <tc-guardrail-notice> in real browsers: the three actions, policy and reason, the before / after with marked and
 * masked runs, the disclosure, Request review and dismiss as events, inline and banner, the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/guardrail-notice";
import type { GuardrailReviewRequest, GuardrailSegment, TcGuardrailNotice } from "../../src/elements/guardrail-notice";
import { GuardrailNotice } from "../../src/elements/react/guardrail-notice";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const ORIGINAL: GuardrailSegment[] = [{ text: "Refund went to the card ending " }, { text: "•••• 4821", mark: "masked" }, { text: " today." }];
const REVISED: GuardrailSegment[] = [{ text: "Refund went to the " }, { text: "card ending •••• 4821", mark: "removed" }, { text: "card on file", mark: "added" }, { text: " today." }];

const notice = (attrs: Partial<TcGuardrailNotice> = {}) =>
  fixture<TcGuardrailNotice>(
    html`<tc-guardrail-notice action="redacted" policy="Personal data" reason="The reply quoted a card number." .original=${ORIGINAL} .revised=${REVISED} .dismissible=${attrs.dismissible ?? false}></tc-guardrail-notice>`,
  );
const btn = (el: Element, label: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === label);
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
const finishAnimations = () => document.getAnimations().forEach((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.finish());

describe("tc-guardrail-notice", () => {
  test("the host is the root, a group named by the heading, in both looks", async () => {
    const el = await notice();
    expect(el.dataset.ui).toBe("grn");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("group");
    expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Redacted by policy");
    // Standard: the buttons sit on the tray below the card; Clean: in the card
    expect(el.querySelector(":scope > .ui-grn__actions")).not.toBeNull();
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(":scope > .ui-grn__card > .ui-grn__actions")).not.toBeNull();
    const provided = await fixture(html`<tc-look-provider look="clean"><tc-guardrail-notice></tc-guardrail-notice></tc-look-provider>`);
    expect(provided.querySelector("tc-guardrail-notice")!.dataset.look).toBe("clean");
  });

  test("the action sets the heading and tone; heading, labels and policy link are properties", async () => {
    const el = await notice();
    expect(el.getAttribute("action")).toBe("redacted");
    el.action = "blocked";
    await settle();
    expect(el.querySelector(".ui-grn__title")!.textContent).toBe("Blocked by policy");
    expect(el.querySelector(".ui-grn__side[data-side='revised'] .ui-grn__side-label")!.textContent).toBe("Shown instead");
    el.action = "rewritten";
    await settle();
    expect(el.querySelector(".ui-grn__title")!.textContent).toBe("Rewritten by policy");
    expect(getComputedStyle(el).getPropertyValue("--tc-guardrail-notice-fg")).not.toBe(getComputedStyle(await notice()).getPropertyValue("--tc-guardrail-notice-fg"));
    el.heading = "We changed this reply";
    el.originalLabel = "Draft";
    el.revisedLabel = "Sent";
    el.policyHref = "/policies/pii";
    await settle();
    expect(el.querySelector(".ui-grn__title")!.textContent).toBe("We changed this reply");
    expect([...el.querySelectorAll(".ui-grn__side-label")].map((l) => l.textContent)).toEqual(["Draft", "Sent"]);
    const link = el.querySelector<HTMLAnchorElement>(".ui-grn__policy a")!;
    expect(link.textContent).toBe("Personal data");
    expect(link.getAttribute("href")).toBe("/policies/pii");
    expect(el.querySelector(".ui-grn__policy")!.textContent).toContain("Policy: ");
    expect(el.querySelector(".ui-grn__reason")!.textContent).toBe("The reply quoted a card number.");
  });

  test("what changed: folded away, a disclosure opens it; the runs are marked for eyes and screen readers", async () => {
    const el = await notice();
    const toggle = btn(el, "Show what changed")!;
    const changes = el.querySelector<HTMLElement>(".ui-grn__changes")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-controls")).toBe(changes.id);
    expect(changes.hidden).toBe(true);
    const seen = listen<{ open: boolean }>(el, "tc-open-change");
    toggle.click();
    await settle();
    expect(seen).toEqual([{ open: true }]);
    expect(el.open).toBe(true);
    expect(changes.hidden).toBe(false);
    expect(btn(el, "Hide what changed")!.getAttribute("aria-expanded")).toBe("true");
    const masked = el.querySelector('[data-side="original"] [data-mark="masked"]')!;
    expect(masked.textContent).toBe("Masked: •••• 4821");
    expect(el.querySelector('[data-side="revised"] del')!.textContent).toBe("Removed: card ending •••• 4821");
    expect(el.querySelector('[data-side="revised"] ins')!.textContent).toBe("Added: card on file");
    // Text works too; nothing shows "Nothing"
    el.original = "Plain original text";
    el.revised = undefined;
    await settle();
    expect(el.querySelector('[data-side="original"] .ui-grn__text')!.textContent).toBe("Plain original text");
    expect(el.querySelector('[data-side="revised"] .ui-grn__text')!.textContent).toBe("Nothing");
    // No before or after: no disclosure
    el.original = undefined;
    await settle();
    expect(el.querySelector(".ui-grn__changes")).toBeNull();
    expect(btn(el, "Hide what changed")).toBeUndefined();
  });

  test("open, controlled: preventDefault keeps it closed until the app opens it", async () => {
    const el = await notice();
    listen(el, "tc-open-change", true);
    btn(el, "Show what changed")!.click();
    await settle();
    expect(el.open).toBe(false);
    el.open = true;
    await settle();
    expect(el.hasAttribute("open")).toBe(true);
    expect(el.querySelector<HTMLElement>(".ui-grn__changes")!.hidden).toBe(false);
  });

  test("Request review: a cancelable event, then Review requested with focus kept and a status message", async () => {
    const el = await notice();
    const seen = listen<GuardrailReviewRequest>(el, "tc-review-request");
    const review = btn(el, "Request review")!;
    review.focus();
    review.click();
    await settle();
    expect(seen).toEqual([{ action: "redacted", policy: "Personal data" }]);
    expect(el.requested).toBe(true);
    expect(btn(el, "Request review")).toBeUndefined();
    expect(el.querySelector(".ui-grn__requested")!.textContent).toContain("Review requested");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Review requested. The Personal data decision will be looked at again.");
    expect(document.activeElement).toBe(el.querySelector(".ui-grn__requested"));
  });

  test("Request review, prevented: the button stays; reviewable=false and the labels", async () => {
    const el = await notice();
    listen(el, "tc-review-request", true);
    btn(el, "Request review")!.click();
    await settle();
    expect(el.requested).toBe(false);
    expect(btn(el, "Request review")).toBeTruthy();
    el.reviewLabel = "Ask a reviewer";
    el.requestedLabel = "Sent to a reviewer";
    await settle();
    expect(btn(el, "Ask a reviewer")).toBeTruthy();
    el.requested = true;
    await settle();
    expect(el.querySelector(".ui-grn__requested")!.textContent).toContain("Sent to a reviewer");
    el.setAttribute("reviewable", "false");
    await settle();
    expect(el.querySelector(".ui-grn__requested")).toBeNull();
  });

  test("dismissible: a close button that fires tc-dismiss", async () => {
    const el = await notice({ dismissible: true });
    const seen = listen(el, "tc-dismiss");
    btn(el, "Dismiss")!.click();
    expect(seen).toHaveLength(1);
    const plain = await notice();
    expect(btn(plain, "Dismiss")).toBeUndefined();
  });

  test("banner: a region, one row with the buttons, the changes under it", async () => {
    const el = await fixture<TcGuardrailNotice>(
      html`<tc-guardrail-notice layout="banner" action="blocked" policy="External sharing" .original=${"To: ████@████.io"} dismissible></tc-guardrail-notice>`,
    );
    expect(el.getAttribute("role")).toBe("region");
    expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Blocked by policy");
    const row = el.querySelector(".ui-grn__row")!;
    expect(row.querySelector(".ui-grn__actions")).not.toBeNull();
    expect(row.querySelector(".ui-grn__close")).not.toBeNull();
    btn(el, "Show what changed")!.click();
    await settle();
    expect(el.querySelector(".ui-grn__card > .ui-grn__changes")!.hasAttribute("hidden")).toBe(false);
  });

  test("React wrapper: title, uncontrolled open survives a parent re-render, callbacks fire, onDismiss shows the close", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onOpenChange = vi.fn();
    const onRequestReview = vi.fn();
    const onDismiss = vi.fn();
    const draw = (n: number) =>
      root.render(React.createElement(GuardrailNotice, { title: `Notice ${n}`, action: "rewritten", policy: "Tone", original: ORIGINAL, revised: REVISED, onOpenChange, onRequestReview, onDismiss, className: "consumer" }));
    await act(async () => draw(1));
    await settle();
    const el = host.querySelector("tc-guardrail-notice")!;
    expect(el.classList.contains("consumer")).toBe(true);
    expect(el.querySelector(".ui-grn__title")!.textContent).toBe("Notice 1");
    await act(async () => btn(el, "Show what changed")!.click());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    await act(async () => draw(2));
    await settle();
    expect(el.open).toBe(true);
    expect(el.querySelector(".ui-grn__title")!.textContent).toBe("Notice 2");
    await act(async () => btn(el, "Request review")!.click());
    expect(onRequestReview).toHaveBeenCalledWith({ action: "rewritten", policy: "Tone" }, expect.any(Event));
    btn(el, "Dismiss")!.click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await act(async () => root.unmount());
  });

  test("React wrapper, controlled: open stays with the app; no onDismiss, no close", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onOpenChange = vi.fn();
    await act(async () => root.render(React.createElement(GuardrailNotice, { open: false, original: "a", revised: "b", onOpenChange })));
    await settle();
    const el = host.querySelector("tc-guardrail-notice")!;
    expect(btn(el, "Dismiss")).toBeUndefined();
    await act(async () => btn(el, "Show what changed")!.click());
    await settle();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(el.open).toBe(false);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
            <tc-guardrail-notice look=${look} layout="banner" action="blocked" policy="External sharing" policy-href="#p" reason="Addressed outside the organisation." .original=${"To: ████@████.io"} open dismissible></tc-guardrail-notice>
            <tc-guardrail-notice look=${look} action="redacted" policy="Personal data" reason="A card number." .original=${ORIGINAL} .revised=${REVISED} open></tc-guardrail-notice>
            <tc-guardrail-notice look=${look} action="rewritten" policy="Tone" .original=${"x"} .revised=${"y"} requested></tc-guardrail-notice>
          </div>`,
        );
        finishAnimations();
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
