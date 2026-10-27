/*
 * <tc-review-conflict> in real browsers: the host and both looks, the two verdicts with who, when and why, the
 * difference, the resolver's radio group, the required reason, confirm (button and Ctrl+Enter), cancelable
 * tc-resolve, override, the resolved state and focus, blind mode with and without a viewer, read-only, the React
 * wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/review-conflict";
import type { ReviewResolveDetail, ReviewVerdict, TcReviewConflict } from "../../src/elements/review-conflict";
import { ReviewConflict } from "../../src/elements/react/review-conflict";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const REVIEWS: ReviewVerdict[] = [
  { id: "a", reviewer: { name: "Ana Ruiz", role: "Research" }, verdict: "Supported", tone: "positive", at: "09:14", reason: "Matches the report." },
  { id: "b", reviewer: { name: "Ben Okafor" }, verdict: "Not supported", tone: "negative", at: "10:02", reason: "The report was restated." },
];
const make = (look = "standard") =>
  fixture<TcReviewConflict>(html`<tc-review-conflict look=${look} item="Revenue grew 18%." resolver="Dana" .reviews=${REVIEWS}></tc-review-conflict>`);
const radios = (el: Element) => [...el.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
const confirmBtn = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-rcf__btn")!;
const reasonField = (el: Element) => el.querySelector<HTMLTextAreaElement>("textarea")!;
const type = async (field: HTMLInputElement | HTMLTextAreaElement, text: string) => {
  field.value = text;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};

describe("tc-review-conflict", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a group named by its heading; both verdicts side by side with who, when and why`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rcf");
      expect(el.dataset.look).toBe(look);
      expect(el.dataset.state).toBe("open");
      expect(el.getAttribute("role")).toBe("group");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Review conflict");
      expect(plain(el.querySelector(".tc-head__aside")!.textContent)).toBe("Unresolved");
      expect(el.querySelector(".ui-rcf__item")!.textContent).toBe("Revenue grew 18%.");
      const cards = el.querySelectorAll(".ui-rcf__verdict");
      expect(cards.length).toBe(2);
      expect(plain(cards[0].querySelector(".ui-rcf__name")!.textContent)).toBe("Ana Ruiz");
      expect(plain(cards[0].querySelector(".ui-rcf__meta")!.textContent)).toBe("Research · 09:14");
      expect(cards[0].querySelector<HTMLElement>(".ui-rcf__badge")!.dataset.tone).toBe("positive");
      expect(plain(cards[1].querySelector(".ui-rcf__reason")!.textContent)).toBe("The report was restated.");
      expect(plain(el.querySelector(".ui-rcf__diff")!.textContent)).toBe("The difference: Ana Ruiz says “Supported”; Ben Okafor says “Not supported”.");
      expect(!!el.querySelector(".ui-rcf__card .ui-rcf__foot")).toBe(look === "clean");
    });
  }

  test("a radio group: the two verdicts and Override share a name; picking one marks it", async () => {
    const el = await make();
    const r = radios(el);
    expect(r.length).toBe(3);
    expect(new Set(r.map((x) => x.name)).size).toBe(1);
    expect(r[0].getAttribute("aria-label")).toBe("Uphold Ana Ruiz: Supported");
    expect(el.querySelector("fieldset legend")!.textContent).toBe("Uphold a verdict");
    el.querySelectorAll<HTMLElement>(".ui-rcf__verdict")[1].click();
    await settle();
    expect(r[1].checked).toBe(true);
    expect(el.querySelectorAll(".ui-rcf__verdict")[1].hasAttribute("data-picked")).toBe(true);
  });

  test("Confirm waits for a pick and a reason, and the hint says what's missing", async () => {
    const el = await make();
    const hint = () => el.querySelector(".ui-rcf__hint")!.textContent;
    expect(confirmBtn(el).disabled).toBe(true);
    expect(hint()).toBe("Pick a verdict to uphold, or override.");
    radios(el)[1].click();
    await settle();
    expect(hint()).toBe("Give a reason – it's kept with the resolution.");
    expect(reasonField(el).getAttribute("aria-describedby")).toBe(el.querySelector(".ui-rcf__hint")!.id);
    await type(reasonField(el), "   ");
    expect(confirmBtn(el).disabled).toBe(true);
    await type(reasonField(el), "The restatement supersedes the report.");
    expect(confirmBtn(el).disabled).toBe(false);
  });

  test("confirming fires tc-resolve and shows the outcome; focus moves to it", async () => {
    const el = await make();
    const seen: ReviewResolveDetail[] = [];
    el.addEventListener("tc-resolve", (e) => seen.push((e as CustomEvent<ReviewResolveDetail>).detail));
    radios(el)[1].click();
    await type(reasonField(el), " Restated. ");
    confirmBtn(el).focus();
    confirmBtn(el).click();
    await settle();
    await wait(50);
    expect(seen).toEqual([{ choice: "b", verdict: "Not supported", reason: "Restated." }]);
    expect(el.resolution).toEqual({ choice: "b", verdict: "Not supported", reason: "Restated.", by: "Dana" });
    expect(el.dataset.state).toBe("resolved");
    expect(plain(el.querySelector(".tc-head__aside")!.textContent)).toBe("Resolved");
    expect(el.querySelector(".ui-rcf__foot")).toBeNull();
    expect(radios(el).length).toBe(0);
    const cards = el.querySelectorAll<HTMLElement>(".ui-rcf__verdict");
    expect(cards[0].dataset.outcome).toBe("overruled");
    expect(cards[1].dataset.outcome).toBe("upheld");
    expect(plain(el.querySelector(".ui-rcf__outcome")!.textContent)).toBe("Upheld Ben Okafor's verdict by Dana Restated.");
    expect(document.activeElement).toBe(el.querySelector(".ui-rcf__outcome"));
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Conflict resolved: Not supported.");
  });

  test("override needs its own verdict; Ctrl+Enter in the reason confirms; prevented, nothing changes", async () => {
    const el = await make();
    let prevent = true;
    const seen: ReviewResolveDetail[] = [];
    el.addEventListener("tc-resolve", (e) => {
      seen.push((e as CustomEvent<ReviewResolveDetail>).detail);
      if (prevent) e.preventDefault();
    });
    radios(el)[2].click();
    await settle();
    await type(reasonField(el), "Neither checked the filing.");
    expect(el.querySelector(".ui-rcf__hint")!.textContent).toBe("Give your verdict.");
    await type(el.querySelector<HTMLInputElement>('input[type="text"]')!, "Needs more evidence");
    const enter = () => reasonField(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true, cancelable: true }));
    enter();
    await settle();
    expect(seen).toEqual([{ choice: "override", verdict: "Needs more evidence", reason: "Neither checked the filing." }]);
    expect(el.resolution).toBeNull();
    prevent = false;
    enter();
    await settle();
    expect(el.resolution?.choice).toBe("override");
    expect(plain(el.querySelector(".ui-rcf__outcome-what")!.textContent)).toBe("Overridden: “Needs more evidence” by Dana");
    expect([...el.querySelectorAll<HTMLElement>(".ui-rcf__verdict")].map((c) => c.dataset.outcome)).toEqual(["overruled", "overruled"]);
  });

  test("blind with a viewer: their own verdict, the other sealed, no names, no difference, no controls", async () => {
    const el = await make();
    el.blind = true;
    el.viewer = "a";
    await settle();
    expect(el.dataset.state).toBe("blind");
    expect(plain(el.querySelector(".ui-rcf__blind")!.textContent)).toMatch(/^A conflict exists\. Another reviewer reached a different verdict\./);
    expect(el.textContent).not.toContain("Ben Okafor");
    expect(el.textContent).not.toContain("Not supported");
    expect(el.textContent).not.toContain("restated");
    const cards = el.querySelectorAll(".ui-rcf__verdict");
    expect(plain(cards[0].querySelector(".ui-rcf__name")!.textContent)).toBe("You");
    expect(cards[1].hasAttribute("data-sealed")).toBe(true);
    expect(el.querySelector(".ui-rcf__diff")).toBeNull();
    expect(radios(el).length).toBe(0);
    expect(el.querySelector(".ui-rcf__foot")).toBeNull();
    el.viewer = undefined;
    await settle();
    expect(el.textContent).not.toContain("Ana Ruiz");
    expect(el.querySelectorAll("[data-sealed]").length).toBe(2);
    // Resolved while blind: the outcome, not who resolved it or whose verdict it was
    el.resolution = { choice: "b", verdict: "Not supported", reason: "Restated.", by: "Dana" };
    await settle();
    expect(plain(el.querySelector(".ui-rcf__outcome-what")!.textContent)).toBe("Upheld “Not supported”");
  });

  test("read-only: not resolvable shows the conflict and who's waiting, without controls; text is a property", async () => {
    const el = await make();
    el.resolvable = false;
    el.difference = "One used the restated figures.";
    el.confirmLabel = "Resolve";
    await settle();
    expect(radios(el).length).toBe(0);
    expect(el.querySelector(".ui-rcf__waiting")!.textContent).toBe("Waiting for someone to resolve it.");
    expect(plain(el.querySelector(".ui-rcf__diff")!.textContent)).toBe("The difference: One used the restated figures.");
    el.resolvable = true;
    await settle();
    expect(confirmBtn(el).textContent!.trim()).toBe("Resolve");
  });

  test("a pick that no longer exists is cleared when the reviews change", async () => {
    const el = await make();
    radios(el)[0].click();
    await settle();
    el.reviews = [{ ...REVIEWS[1] }, { ...REVIEWS[0], id: "c" }];
    await settle();
    expect(el.querySelector(".ui-rcf__hint")!.textContent).toBe("Pick a verdict to uphold, or override.");
  });

  test("the wrapper: controlled resolution, onResolve with the resolver's name", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: unknown[] = [];
    await act(async () =>
      root.render(React.createElement(ReviewConflict, { title: "Disputed figure", reviews: REVIEWS, resolver: "Dana", resolution: null, onResolve: (r) => calls.push(r) })),
    );
    await settle();
    const el = host.querySelector("tc-review-conflict")!;
    expect(el.querySelector("h3")!.textContent).toBe("Disputed figure");
    radios(el)[0].click();
    await type(reasonField(el), "Fine.");
    confirmBtn(el).click();
    await settle();
    expect(calls).toEqual([{ choice: "a", verdict: "Supported", reason: "Fine.", by: "Dana" }]);
    // Controlled and not updated by the parent: still open
    expect(el.resolution).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10" : ""}>
        <tc-review-conflict item="Revenue grew 18%." .reviews=${REVIEWS}></tc-review-conflict>
        <tc-review-conflict look="clean" heading="Resolved" .reviews=${REVIEWS} .resolution=${{ choice: "a", verdict: "Supported", reason: "Fine.", by: "Dana" }}></tc-review-conflict>
        <tc-review-conflict heading="Blind" blind viewer="a" .reviews=${REVIEWS}></tc-review-conflict>
      </div>`);
      wrap.querySelectorAll<HTMLInputElement>('input[type="radio"]')[2].click();
      await settle();
      await wait(400);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
