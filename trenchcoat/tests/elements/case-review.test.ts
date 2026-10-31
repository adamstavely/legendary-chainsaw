/*
 * <tc-case-review> in real browsers: the assistant only suggests, deciding needs an outcome and a reason, changing a
 * decision, composed evidence, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/case-review";
import type { CaseDecisionChange, CaseRead, TcCaseReview } from "../../src/elements/case-review";
import type { FactSection } from "../../src/elements/fact-sheet";
import { CaseReview } from "../../src/elements/react/case-review";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const READ: CaseRead = { summary: "Two payments.", points: ["Same invoice"], suggestion: "escalate", confidence: "Moderately confident" };
const FACTS: FactSection[] = [{ id: "s", title: "Payments", facts: [{ id: "a", label: "Amount", value: "$10" }] }];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const review = () => fixture<TcCaseReview>(html`<tc-case-review heading="Case 1" subject="Northwind" severity="high" .read=${READ} .facts=${FACTS}></tc-case-review>`);
const radio = (el: Element, id: string) => el.querySelector<HTMLInputElement>(`input[value="${id}"]`)!;
const pick = async (el: Element, id: string) => {
  radio(el, id).click();
  await settle();
};
const write = async (el: Element, value: string) => {
  const t = el.querySelector<HTMLTextAreaElement>(".ui-csr__note")!;
  t.value = value;
  t.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
const record = async (el: Element) => {
  el.querySelector<HTMLElement>(".ui-csr__record")!.click();
  await settle();
};

describe("tc-case-review", () => {
  test("shows the case, with severity in words, and composes the evidence", async () => {
    const el = await review();
    expect(el.dataset.ui).toBe("csr");
    expect(text(el.querySelector("h2"))).toBe("Case 1");
    expect(text(el.querySelector(".ui-csr__severity"))).toBe("High severity");
    expect(text(el.querySelector("tc-fact-sheet"))).toContain("$10");
    expect(el.querySelector("tc-entity-timeline")).toBeNull();
  });

  test("the assistant suggests, but nothing is chosen", async () => {
    const el = await review();
    expect(text(el.querySelector(".ui-csr__advisory"))).toContain("The decision is yours");
    expect(text(el.querySelector(".ui-csr__suggests"))).toBe("Suggests: Escalate · Moderately confident");
    expect(text(radio(el, "escalate").closest("label"))).toContain("Suggested");
    expect(el.querySelectorAll("input:checked")).toHaveLength(0);
    expect(el.decision).toBeNull();
  });

  test("recording needs an outcome, then a reason, and focus goes to what's missing", async () => {
    const el = await review();
    const seen: unknown[] = [];
    el.addEventListener("tc-decision-change", (e) => seen.push(e));
    await record(el);
    expect(text(el)).toContain("Choose an outcome.");
    await expect.poll(() => document.activeElement).toBe(radio(el, "approve"));
    await pick(el, "approve");
    await write(el, "   ");
    await record(el);
    expect(text(el)).toContain("Add your reason.");
    expect(el.querySelector(".ui-csr__note")!.getAttribute("aria-invalid")).toBe("true");
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-csr__note"));
    expect(seen).toHaveLength(0);
  });

  test("a recorded decision says whether it followed the suggestion", async () => {
    const el = await review();
    const seen: CaseDecisionChange[] = [];
    el.addEventListener("tc-decision-change", (e) => seen.push((e as CustomEvent<CaseDecisionChange>).detail));
    await pick(el, "decline");
    await write(el, " Supplier confirmed. ");
    await record(el);
    expect(seen[0]!.decision).toEqual({ option: "decline", note: "Supplier confirmed." });
    expect(seen[0]!.followedSuggestion).toBe(false);
    expect(text(el.querySelector(".ui-csr__outcome"))).toContain("Decline");
    expect(text(el.querySelector(".ui-csr__reason"))).toBe("Supplier confirmed.");
    expect(text(el.querySelector(':scope > [role="status"]'))).toContain("Decline");
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-csr__change"));
  });

  test("Change reopens it with what was recorded", async () => {
    const el = await review();
    el.decision = { option: "approve", note: "Fine." };
    await settle();
    el.querySelector<HTMLElement>(".ui-csr__change")!.click();
    await settle();
    expect(radio(el, "approve").checked).toBe(true);
    expect(el.querySelector<HTMLTextAreaElement>(".ui-csr__note")!.value).toBe("Fine.");
  });

  test("preventDefault keeps the decision", async () => {
    const el = await review();
    el.addEventListener("tc-decision-change", (e) => e.preventDefault());
    await pick(el, "approve");
    await write(el, "Fine.");
    await record(el);
    expect(el.decision).toBeNull();
    expect(el.querySelector(".ui-csr__note")).toBeTruthy();
  });

  test("with no read, it still decides, with no suggestion", async () => {
    const el = await fixture<TcCaseReview>(html`<tc-case-review></tc-case-review>`);
    const seen: CaseDecisionChange[] = [];
    el.addEventListener("tc-decision-change", (e) => seen.push((e as CustomEvent<CaseDecisionChange>).detail));
    expect(el.querySelector(".ui-csr__read")).toBeNull();
    await pick(el, "approve");
    await write(el, "Fine.");
    await record(el);
    expect(seen[0]!.followedSuggestion).toBeNull();
  });

  test("the assistant's face and name are optional", async () => {
    const el = await fixture<TcCaseReview>(html`<tc-case-review assistant-name="Donovan" assistant-face .read=${READ}></tc-case-review>`);
    expect(el.querySelector("tc-agent-face")).toBeTruthy();
    expect(text(el.querySelector(".ui-csr__read h3"))).toBe("Donovan's read");
  });

  test("goes to one column when narrow, with the decision first", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 500px"><tc-case-review .read=${READ} .facts=${FACTS}></tc-case-review></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-csr__grid")!).gridTemplateColumns.split(" ")).toHaveLength(1);
    expect(getComputedStyle(wrap.querySelector(".ui-csr__side")!).order).toBe("-1");
  });
});

describe("React", () => {
  test("a controlled decision stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(CaseReview, { decision: null })));
    await settle();
    const el = host.querySelector<TcCaseReview>("tc-case-review")!;
    await act(async () => {
      await pick(el, "approve");
      await write(el, "Fine.");
      await record(el);
    });
    expect(el.decision).toBeNull();
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas; color: CanvasText`}><tc-case-review heading="Case 1" severity="critical" .read=${READ} .facts=${FACTS}></tc-case-review></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
