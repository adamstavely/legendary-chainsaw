/*
 * <tc-approval-chain> in real browsers: who's next and overdue, Approve, Decline with a note, Delegate, not reached,
 * controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/approval-chain";
import type { ApprovalStep, ApprovalStepsChange, TcApprovalChain } from "../../src/elements/approval-chain";
import { ApprovalChain } from "../../src/elements/react/approval-chain";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 9, 31);
const STEPS: ApprovalStep[] = [
  { id: "a", name: "Tomás", role: "Lead", status: "approved", decidedAt: NOW - 1000 },
  { id: "b", name: "Noor", status: "current", dueAt: NOW - 1000 },
  { id: "c", name: "Maya", status: "waiting" },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const mount = async (node: React.ReactElement) => {
  const host = document.body.appendChild(document.createElement("div"));
  const root = createRoot(host);
  await act(async () => root.render(node));
  await settle();
  return { host, root };
};
const chain = (actor = "Noor") => fixture<TcApprovalChain>(html`<tc-approval-chain .steps=${STEPS} actor=${actor} .delegates=${["Inês", "Noor"]} .now=${NOW}></tc-approval-chain>`);
const step = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-step="${id}"]`)!;
const captured = (el: Element) => {
  const seen: ApprovalStepsChange[] = [];
  el.addEventListener("tc-steps-change", (e) => seen.push((e as CustomEvent<ApprovalStepsChange>).detail));
  return seen;
};

describe("tc-approval-chain", () => {
  test("says who's next and who's overdue, in words", async () => {
    const el = await chain();
    expect(el.dataset.ui).toBe("apc");
    expect(text(el.querySelector(".ui-apc__summary"))).toBe("Next: Noor");
    expect(text(step(el, "b"))).toContain("Overdue");
    expect(step(el, "b").getAttribute("aria-current")).toBe("step");
    expect(text(step(el, "a"))).toContain("Approved");
    expect(text(step(el, "c"))).toContain("Waiting");
  });

  test("without now, nothing's overdue", async () => {
    const el = await fixture<TcApprovalChain>(html`<tc-approval-chain .steps=${STEPS}></tc-approval-chain>`);
    expect(el.querySelector(".ui-apc__overdue")).toBeNull();
  });

  test("only the person it's waiting on gets the actions", async () => {
    expect((await chain("Maya")).querySelector(".ui-apc__approve")).toBeNull();
    expect(step(await chain(), "b").querySelector(".ui-apc__approve")).toBeTruthy();
  });

  test("Approve moves the chain on, and all done says so", async () => {
    const el = await chain();
    const seen = captured(el);
    el.querySelector<HTMLElement>(".ui-apc__approve")!.click();
    await settle();
    expect(seen[0]!.change).toBe("approve");
    expect(seen[0]!.step.decidedAt).toBe(NOW);
    expect(el.steps.map((s) => s.status)).toEqual(["approved", "approved", "current"]);
    expect(text(el.querySelector('[role="status"]'))).toContain("Maya");
    el.actor = "Maya";
    await settle();
    el.querySelector<HTMLElement>(".ui-apc__approve")!.click();
    await settle();
    expect(text(el.querySelector(".ui-apc__summary"))).toBe("All signed off");
  });

  test("Decline needs a note, and the rest aren't reached", async () => {
    const el = await chain();
    const seen = captured(el);
    el.querySelector<HTMLElement>(".ui-apc__decline")!.click();
    await settle();
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-apc__note"));
    el.querySelector<HTMLElement>(".ui-apc__confirm-decline")!.click();
    await settle();
    expect(seen).toHaveLength(0);
    expect(text(el.querySelector(".ui-apc__error"))).toContain("reason");
    expect(el.querySelector(".ui-apc__note")!.getAttribute("aria-invalid")).toBe("true");
    const t = el.querySelector<HTMLTextAreaElement>(".ui-apc__note")!;
    t.value = " Numbers are wrong. ";
    t.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    el.querySelector<HTMLElement>(".ui-apc__confirm-decline")!.click();
    await settle();
    expect(seen[0]!.step.note).toBe("Numbers are wrong.");
    expect(text(step(el, "c"))).toContain("Not reached");
    expect(text(el.querySelector(".ui-apc__summary"))).toBe("Declined by Noor");
    expect(text(step(el, "b"))).toContain("Numbers are wrong.");
    await expect.poll(() => document.activeElement).toBe(step(el, "b").querySelector(".ui-apc__name"));
  });

  test("Delegate hands it on, and the new person can act", async () => {
    const el = await chain();
    const seen = captured(el);
    el.querySelector<HTMLElement>(".ui-apc__delegate-open")!.click();
    await settle();
    expect([...el.querySelector<HTMLSelectElement>(".ui-apc__delegate")!.options].map((o) => o.value)).toEqual(["Inês"]);
    el.querySelector<HTMLElement>(".ui-apc__confirm-delegate")!.click();
    await settle();
    expect(seen[0]!.change).toBe("delegate");
    expect(text(step(el, "b"))).toContain("Delegated to Inês");
    expect(text(el.querySelector(".ui-apc__summary"))).toBe("Next: Inês");
    expect(el.querySelector(".ui-apc__approve")).toBeNull();
    el.actor = "Inês";
    await settle();
    expect(el.querySelector(".ui-apc__approve")).toBeTruthy();
  });

  test("Cancel backs out, and preventDefault keeps the steps", async () => {
    const el = await chain();
    el.querySelector<HTMLElement>(".ui-apc__decline")!.click();
    await settle();
    el.querySelector<HTMLElement>(".ui-apc__cancel")!.click();
    await settle();
    expect(el.querySelector(".ui-apc__note")).toBeNull();
    el.addEventListener("tc-steps-change", (e) => e.preventDefault());
    el.querySelector<HTMLElement>(".ui-apc__approve")!.click();
    await settle();
    expect(el.steps).toBe(STEPS);
  });
});

describe("React", () => {
  test("controlled steps stay until the parent changes them", async () => {
    const seen: ApprovalStep[][] = [];
    const { host, root } = await mount(React.createElement(ApprovalChain, { steps: STEPS, actor: "Noor", onStepsChange: (s: ApprovalStep[]) => seen.push(s) }));
    const el = host.querySelector<TcApprovalChain>("tc-approval-chain")!;
    await act(async () => el.querySelector<HTMLElement>(".ui-apc__approve")!.click());
    expect(seen).toHaveLength(1);
    expect(el.steps).toBe(STEPS);
    await act(async () => root.unmount());
    host.remove();
  });

  test("uncontrolled steps survive the parent re-rendering", async () => {
    const node = () => React.createElement(ApprovalChain, { defaultSteps: STEPS, actor: "Noor" });
    const { host, root } = await mount(node());
    const el = host.querySelector<TcApprovalChain>("tc-approval-chain")!;
    await act(async () => el.querySelector<HTMLElement>(".ui-apc__approve")!.click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.steps[1]!.status).toBe("approved");
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas; color: CanvasText`}><tc-approval-chain .steps=${STEPS} actor="Noor" .now=${NOW} .delegates=${["Inês"]}></tc-approval-chain></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
