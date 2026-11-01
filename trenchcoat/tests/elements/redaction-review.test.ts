/*
 * <tc-redaction-review> in real browsers: hidden text stays out of the markup, reveal, keys, approve and reject, Approve
 * all, Share only when nothing's left, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/redaction-review";
import type { Redaction, RedactionBlock, RedactionShare, RedactionsChange, TcRedactionReview } from "../../src/elements/redaction-review";
import { RedactionReview } from "../../src/elements/react/redaction-review";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const BLOCKS: RedactionBlock[] = [
  { id: "p1", page: 1, text: "Raised by Jordan Vale on 3 March." },
  { id: "p2", page: 2, text: "Paid to account 4471 in full." },
];
const R: Redaction[] = [
  { id: "r2", block: "p2", start: 8, end: 20, reason: "Bank details", status: "approved" },
  { id: "r1", block: "p1", start: 10, end: 21, reason: "Personal name", status: "proposed", proposedBy: "Auto-detect" },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const mount = async (node: React.ReactElement) => {
  const host = document.body.appendChild(document.createElement("div"));
  const root = createRoot(host);
  await act(async () => root.render(node));
  await settle();
  return { host, root };
};
const review = (redactions = R) => fixture<TcRedactionReview>(html`<tc-redaction-review .blocks=${BLOCKS} .redactions=${redactions}></tc-redaction-review>`);
const span = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-redaction="${id}"]`)!;

describe("tc-redaction-review", () => {
  test("hidden text isn't in the markup, and each bar has its reason", async () => {
    const el = await review();
    expect(el.dataset.ui).toBe("rdq");
    expect(el.textContent).not.toContain("Jordan Vale");
    expect(el.textContent).not.toContain("account 4471");
    expect(text(span(el, "r1"))).toContain("Personal name");
    expect(text(span(el, "r1"))).toContain("Redacted");
    expect(text(el.querySelector(".ui-rdq__left"))).toBe("1 left to review");
    expect([...el.querySelectorAll(".ui-rdq__page")].map(text)).toEqual(["Page 1", "Page 2"]);
  });

  test("reveals one at a time, and moving on hides it", async () => {
    const el = await review();
    el.querySelector<HTMLElement>(".ui-rdq__reveal")!.click();
    await settle();
    expect(text(span(el, "r1").querySelector(".ui-rdq__text"))).toBe("Jordan Vale");
    span(el, "r2").click();
    await settle();
    expect(el.textContent).not.toContain("Jordan Vale");
    el.querySelector<HTMLElement>(".ui-rdq__reveal")!.click();
    await settle();
    expect(el.textContent).toContain("account 4471");
    el.querySelector<HTMLElement>(".ui-rdq__reveal")!.click();
    await settle();
    expect(el.textContent).not.toContain("account 4471");
  });

  test("is one tab stop, in reading order, and arrow keys move", async () => {
    const el = await review();
    expect(el.querySelectorAll('.ui-rdq__span[tabindex="0"]')).toHaveLength(1);
    expect(span(el, "r1").tabIndex).toBe(0);
    span(el, "r1").focus();
    span(el, "r1").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => document.activeElement).toBe(span(el, "r2"));
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => document.activeElement).toBe(span(el, "r1"));
  });

  test("approving moves on, and rejecting shows the text with its word", async () => {
    const seen: RedactionsChange[] = [];
    const el = await review();
    el.addEventListener("tc-redactions-change", (e) => seen.push((e as CustomEvent<RedactionsChange>).detail));
    el.querySelector<HTMLElement>(".ui-rdq__reject")!.click();
    await settle();
    expect(seen[0]!.redaction!.status).toBe("rejected");
    expect(text(span(el, "r1"))).toContain("Jordan Vale");
    expect(text(span(el, "r1"))).toContain("Not redacted");
    el.querySelector<HTMLElement>(".ui-rdq__approve")!.click();
    await settle();
    expect(el.redactions.find((r) => r.id === "r1")!.status).toBe("approved");
    expect(el.textContent).not.toContain("Jordan Vale");
  });

  test("Share waits until none are left, and Approve all gets there", async () => {
    const el = await review();
    const shared: RedactionShare[] = [];
    el.addEventListener("tc-share", (e) => shared.push((e as CustomEvent<RedactionShare>).detail));
    const share = el.querySelector<HTMLButtonElement>(".ui-rdq__share")!;
    expect(share.disabled).toBe(true);
    el.querySelector<HTMLElement>(".ui-rdq__approve-all")!.click();
    await settle();
    expect(text(el.querySelector(".ui-rdq__left"))).toBe("All reviewed");
    expect(share.disabled).toBe(false);
    share.click();
    expect(shared[0]!.redactions.every((r) => r.status === "approved")).toBe(true);
  });

  test("preventDefault keeps the redactions", async () => {
    const el = await review();
    el.addEventListener("tc-redactions-change", (e) => e.preventDefault());
    el.querySelector<HTMLElement>(".ui-rdq__approve")!.click();
    await settle();
    expect(el.redactions).toBe(R);
  });

  test("one pointing at missing text blocks Share and says so", async () => {
    const el = await review([{ id: "x", block: "gone", start: 0, end: 1, reason: "Name", status: "proposed" }]);
    expect(el.querySelector<HTMLButtonElement>(".ui-rdq__share")!.disabled).toBe(true);
    expect(text(el.querySelector(".ui-rdq__orphans"))).toContain("isn't shown");
  });

  test("overlapping and out-of-range spans don't leak or break", async () => {
    const el = await review([
      { id: "a", block: "p1", start: 10, end: 16, reason: "One", status: "approved" },
      { id: "b", block: "p1", start: 12, end: 500, reason: "Two", status: "approved" },
    ]);
    expect(el.querySelectorAll(".ui-rdq__span")).toHaveLength(2);
    expect(text(el.querySelector('[data-block="p1"]'))).not.toContain("Vale");
    expect(text(el.querySelector('[data-block="p1"]'))).not.toContain("March");
  });

  test("says so with nothing to review", async () => {
    const el = await fixture<TcRedactionReview>(html`<tc-redaction-review></tc-redaction-review>`);
    expect(text(el.querySelector(".ui-rdq__empty"))).toBe("Nothing to review.");
  });
});

describe("React", () => {
  test("controlled redactions stay until the parent changes them", async () => {
    const seen: Redaction[][] = [];
    const { host, root } = await mount(React.createElement(RedactionReview, { blocks: BLOCKS, redactions: R, onRedactionsChange: (r: Redaction[]) => seen.push(r) }));
    const el = host.querySelector<TcRedactionReview>("tc-redaction-review")!;
    await act(async () => el.querySelector<HTMLElement>(".ui-rdq__approve")!.click());
    expect(seen).toHaveLength(1);
    expect(el.redactions).toBe(R);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas; color: CanvasText`}><tc-redaction-review .blocks=${BLOCKS} .redactions=${R}></tc-redaction-review></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
