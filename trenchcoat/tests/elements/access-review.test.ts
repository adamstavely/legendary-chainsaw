/*
 * <tc-access-review> in real browsers: flagged first, decisions, a required reason for keeping anyone flagged, Keep all
 * authorized, filters, Submit, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/access-review";
import type { AccessReviewItem, AccessReviewSubmit, TcAccessReview } from "../../src/elements/access-review";
import { AccessReview } from "../../src/elements/react/access-review";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ITEMS: AccessReviewItem[] = [
  { id: "ok", name: "Noor", resource: "Trial 12", level: "Can edit", status: "authorized", lastUsed: Date.UTC(2026, 9, 1) },
  { id: "bad", name: "Inês", resource: "Trial 12", level: "Can view", status: "unauthorized", reason: "Agreement ended." },
  { id: "unk", name: "Sam", kind: "group", resource: "Trial 9", level: "Can view", status: "unverified" },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const review = (extra: Partial<TcAccessReview> = {}) => fixture<TcAccessReview>(html`<tc-access-review .items=${ITEMS} .decisions=${extra.decisions ?? {}}></tc-access-review>`);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-item="${id}"]`)!;
const choose = async (el: Element, id: string, c: string) => {
  row(el, id).querySelector<HTMLElement>(`button[data-choice="${c}"]`)!.click();
  await settle();
};
const note = async (el: Element, id: string, value: string) => {
  const t = row(el, id).querySelector<HTMLTextAreaElement>(".ui-acr__note")!;
  t.value = value;
  t.dispatchEvent(new Event("change", { bubbles: true }));
  await settle();
};
const submit = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-acr__submit")!;

describe("tc-access-review", () => {
  test("flagged rows come first, with their reasons in words", async () => {
    const el = await review();
    expect(el.dataset.ui).toBe("acr");
    expect([...el.querySelectorAll<HTMLElement>(".ui-acr__row")].map((r) => r.dataset.item)).toEqual(["bad", "unk", "ok"]);
    expect(text(row(el, "bad"))).toContain("No longer authorized");
    expect(text(row(el, "bad"))).toContain("Agreement ended.");
    expect(text(row(el, "unk"))).toContain("Couldn't be checked");
    expect(text(el.querySelector(".ui-acr__progress"))).toBe("0 of 3 decided");
  });

  test("Keep all authorized never settles a flagged row", async () => {
    const el = await review();
    el.querySelector<HTMLElement>(".ui-acr__keep-all")!.click();
    await settle();
    expect(el.decisions).toEqual({ ok: { choice: "keep" } });
    expect(el.querySelector<HTMLButtonElement>(".ui-acr__keep-all")!.disabled).toBe(true);
  });

  test("keeping someone flagged asks why, and blocks Submit until there's a reason", async () => {
    const el = await review();
    await choose(el, "ok", "keep");
    await choose(el, "unk", "remove");
    expect(submit(el).disabled).toBe(true);
    expect(text(el.querySelector(".ui-acr__hint"))).toContain("1 still to decide");
    await choose(el, "bad", "keep");
    expect(row(el, "bad").querySelector(".ui-acr__note")!.getAttribute("aria-invalid")).toBe("true");
    expect(submit(el).disabled).toBe(true);
    expect(text(el.querySelector(".ui-acr__hint"))).toContain("Add a reason");
    await note(el, "bad", "   ");
    expect(submit(el).disabled).toBe(true);
    await note(el, "bad", "Renewal is signed.");
    expect(submit(el).disabled).toBe(false);
  });

  test("keeping someone authorized needs no reason", async () => {
    const el = await review();
    await choose(el, "ok", "keep");
    expect(row(el, "ok").querySelector(".ui-acr__note")).toBeNull();
  });

  test("Submit reports who's kept and removed", async () => {
    const el = await review();
    const seen: AccessReviewSubmit[] = [];
    el.addEventListener("tc-review-submit", (e) => seen.push((e as CustomEvent<AccessReviewSubmit>).detail));
    await choose(el, "ok", "keep");
    await choose(el, "bad", "remove");
    await choose(el, "unk", "remove");
    submit(el).click();
    await settle();
    expect(seen[0]!.keep.map((i) => i.id)).toEqual(["ok"]);
    expect(seen[0]!.remove.map((i) => i.id)).toEqual(["bad", "unk"]);
    expect(text(el.querySelector('[role="status"]'))).toContain("submitted");
  });

  test("filters narrow the rows, and show how many", async () => {
    const el = await review();
    const filters = () => [...el.querySelectorAll<HTMLElement>(".ui-acr__filter")];
    expect(text(filters()[1])).toBe("Flagged 2");
    filters()[1]!.click();
    await settle();
    expect(el.querySelectorAll(".ui-acr__row")).toHaveLength(2);
    expect(filters()[1]!.getAttribute("aria-pressed")).toBe("true");
    filters()[2]!.click();
    await settle();
    await choose(el, "ok", "keep");
    expect(el.querySelectorAll(".ui-acr__row")).toHaveLength(2);
  });

  test("preventDefault keeps the decisions", async () => {
    const el = await review();
    el.addEventListener("tc-decisions-change", (e) => e.preventDefault());
    await choose(el, "ok", "keep");
    expect(el.decisions).toEqual({});
  });

  test("while sending, the controls are locked", async () => {
    const el = await review();
    el.sending = true;
    await settle();
    expect(row(el, "ok").querySelector<HTMLButtonElement>(".ui-acr__choice")!.disabled).toBe(true);
    expect(submit(el).disabled).toBe(true);
  });

  test("no items can't be submitted", async () => {
    const el = await fixture<TcAccessReview>(html`<tc-access-review></tc-access-review>`);
    expect(text(el.querySelector(".ui-acr__empty"))).toContain("Nothing to show");
    expect(submit(el).disabled).toBe(true);
  });
});

describe("React", () => {
  test("uncontrolled decisions survive the parent re-rendering", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = () => React.createElement(AccessReview, { items: ITEMS });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcAccessReview>("tc-access-review")!;
    await act(async () => choose(el, "ok", "keep"));
    await act(async () => root.render(node()));
    await settle();
    expect(el.decisions.ok).toEqual({ choice: "keep" });
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}`}><tc-access-review .items=${ITEMS} .decisions=${{ bad: { choice: "keep" } }}></tc-access-review></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
