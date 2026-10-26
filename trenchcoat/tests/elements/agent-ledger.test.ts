/*
 * <tc-agent-ledger> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/agent-ledger";
import type { LedgerEntry, TcAgentLedger } from "../../src/elements/agent-ledger";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const entries: LedgerEntry[] = [
  { id: "a", action: "Created product", system: "Stripe", at: 1000 },
  { id: "b", action: "Set price", system: "Stripe", at: 2000, dependsOn: ["a"] },
  { id: "c", action: "Announced price", system: "Slack", at: 3000, dependsOn: ["b"] },
  { id: "x", action: "Added coupon", system: "Stripe", at: 4000, dependsOn: ["a"] },
];

const button = (el: Element, name: RegExp | string) =>
  [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => (typeof name === "string" ? b.getAttribute("aria-label") === name : name.test(b.getAttribute("aria-label") ?? ""))) ?? null;
const undoneRows = (el: Element) => [...el.querySelectorAll("li[data-undone]")];
const click = async (el: Element, name: RegExp | string) => {
  const b = button(el, name);
  expect(b, String(name)).toBeTruthy();
  b!.click();
  await settle();
  return b!;
};

for (const look of ["standard", "clean"] as const) {
  describe(`tc-agent-ledger ${look}`, () => {
    test("the host is the root; the list is named by the heading; rows are newest first", async () => {
      const el = await fixture<TcAgentLedger>(html`<tc-agent-ledger look=${look} agent="Launch agent" .entries=${entries} .now=${5000}></tc-agent-ledger>`);
      expect(el.dataset.ui).toBe("alg");
      expect(el.dataset.look).toBe(look);
      const ol = el.querySelector("ol")!;
      expect(document.getElementById(ol.getAttribute("aria-labelledby")!)!.textContent).toBe("Ledger");
      expect([...el.querySelectorAll(".ui-alg__action")].map((a) => a.textContent)).toEqual(["Added coupon", "Announced price", "Set price", "Created product"]);
      expect(el.querySelector(".ui-alg__sum")!.textContent!.replace(/\s+/g, " ").trim()).toBe("4 changes");
      expect(el.querySelector(".ui-alg__time")!.textContent!.replace(/\s+/g, " ").trim()).toBe("just now · Stripe");
    });

    test("redoing a change also redoes the undone changes it builds on, not their other dependents", async () => {
      const onRedo = vi.fn();
      const el = await fixture<TcAgentLedger>(html`<tc-agent-ledger look=${look} .entries=${entries} .now=${5000} .undone=${["a", "b", "c", "x"]} .onRedo=${onRedo}></tc-agent-ledger>`);
      await click(el, "Redo: Set price");
      expect(onRedo).toHaveBeenCalledTimes(1);
      expect([...onRedo.mock.calls[0][0]].sort()).toEqual(["a", "b", "c"]);
      const undone = undoneRows(el).map((li) => li.textContent);
      expect(undone).toHaveLength(1);
      expect(undone[0]).toContain("Added coupon");
    });

    test("an undo reports the new undone list; tc-undo carries the ids", async () => {
      const changes: string[][] = [];
      const undos: string[][] = [];
      const el = await fixture<TcAgentLedger>(html`<tc-agent-ledger look=${look} .entries=${entries} .now=${5000}
        @tc-undone-change=${(e: CustomEvent<{ undone: string[] }>) => changes.push(e.detail.undone)}
        @tc-undo=${(e: CustomEvent<{ ids: string[] }>) => undos.push(e.detail.ids)}></tc-agent-ledger>`);
      await click(el, /^Undo: Announced price/);
      expect(changes).toEqual([["c"]]);
      expect(undos).toEqual([["c"]]);
      expect(el.undone).toEqual(["c"]);
      expect(undoneRows(el)).toHaveLength(1);
    });

    test("controlled: a prevented change only reports; the value passed back applies", async () => {
      const changes: string[][] = [];
      const el = await fixture<TcAgentLedger>(html`<tc-agent-ledger look=${look} .entries=${entries} .now=${5000} .undone=${[]}
        @tc-undone-change=${(e: CustomEvent<{ undone: string[] }>) => {
          e.preventDefault();
          changes.push(e.detail.undone);
        }}></tc-agent-ledger>`);
      await click(el, /^Undo: Announced price/);
      expect(changes).toEqual([["c"]]);
      expect(undoneRows(el)).toHaveLength(0);
      el.undone = ["b"];
      await settle();
      expect(undoneRows(el).map((li) => li.querySelector(".ui-alg__action")!.textContent)).toEqual(["Set price"]);
    });

    test("an undo that fails goes back and says so", async () => {
      let fail: (e: Error) => void = () => {};
      const onUndo = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
      const el = await fixture<TcAgentLedger>(html`<tc-agent-ledger look=${look} .entries=${entries} .now=${5000} .onUndo=${onUndo}></tc-agent-ledger>`);
      await click(el, /^Undo: Announced price/);
      expect(undoneRows(el)).toHaveLength(1);
      expect(el.querySelector("li[data-pending]")).toBeTruthy();
      fail(new Error("offline"));
      await new Promise((r) => setTimeout(r));
      await settle();
      expect(undoneRows(el)).toHaveLength(0);
      expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/Couldn't undo/);
    });

    test("a status line is there from mount and says what an undo or redo took with it (4.1.3)", async () => {
      const el = await fixture<TcAgentLedger>(html`<tc-agent-ledger look=${look} .entries=${entries} .now=${5000}></tc-agent-ledger>`);
      const status = el.querySelector('[role="status"]')!;
      expect(status.textContent).toBe("");
      await click(el, /^Undo: Set price/);
      expect(el.querySelector('[role="status"]')).toBe(status);
      expect(status.textContent).toBe("Undone: Set price, and 1 change with it");
      await click(el, "Redo: Set price");
      expect(status.textContent).toBe("Redone: Set price, and 1 change with it");
    });

    test("an irreversible change in the chain is named in the announcement", async () => {
      const chain: LedgerEntry[] = [
        { id: "a", action: "Set price", system: "Stripe", at: 1000 },
        { id: "m", action: "Sent email", system: "Mail", at: 2000, dependsOn: ["a"], reversible: false },
      ];
      const el = await fixture<TcAgentLedger>(html`<tc-agent-ledger look=${look} .entries=${chain} .now=${5000}></tc-agent-ledger>`);
      expect(button(el, /^Undo: Sent email/)).toBeNull();
      await click(el, /^Undo: Set price/);
      expect(el.querySelector('[role="status"]')!.textContent).toBe("Undone: Set price. 1 can't be undone");
    });

    test("Undo becomes Redo on the same, still focused button; a pending one stays focusable (2.4.3)", async () => {
      let done: () => void = () => {};
      const onUndo = vi.fn(() => new Promise<void>((r) => (done = r)));
      const el = await fixture<TcAgentLedger>(html`<tc-agent-ledger look=${look} .entries=${entries} .now=${5000} .onUndo=${onUndo}></tc-agent-ledger>`);
      const b = button(el, /^Undo: Announced price/)!;
      b.focus();
      b.click();
      await settle();
      expect(button(el, "Redo: Announced price")).toBe(b);
      expect(document.activeElement).toBe(b);
      expect(b.hasAttribute("disabled")).toBe(false);
      expect(b.getAttribute("aria-disabled")).toBe("true");
      b.click();
      await settle();
      expect(button(el, /^Undo: Announced price/)).toBeNull();
      done();
      await new Promise((r) => setTimeout(r));
      await settle();
      expect(b.hasAttribute("aria-disabled")).toBe(false);
    });

    test("pointing at Undo lights up what builds on it", async () => {
      const chain: LedgerEntry[] = [...entries, { id: "m", action: "Sent email", system: "Mail", at: 4500, dependsOn: ["b"], reversible: false }];
      const el = await fixture<TcAgentLedger>(html`<tc-agent-ledger look=${look} .entries=${chain} .now=${5000}></tc-agent-ledger>`);
      button(el, /^Undo: Set price/)!.dispatchEvent(new MouseEvent("mouseenter"));
      await settle();
      expect(el.querySelector("li[data-preview] .ui-alg__action")!.textContent).toBe("Set price");
      const flags = [...el.querySelectorAll(".ui-alg__flag")].map((f) => [f.closest("li")!.querySelector(".ui-alg__action")!.textContent, f.getAttribute("data-kind"), f.textContent]);
      expect(flags).toEqual([
        ["Sent email", "kept", "Can't undo"],
        ["Announced price", "also", "Also undone"],
      ]);
      button(el, /^Undo: Set price/)!.dispatchEvent(new MouseEvent("mouseleave"));
      await settle();
      expect(el.querySelector("li[data-preview], li[data-chain]")).toBeNull();
      el.pointAt = "b";
      await settle();
      expect(el.querySelectorAll("li[data-chain]")).toHaveLength(2);
    });

    test("before → after reads 'to' as text, with no aria-label on the arrow span; clipped text has a title", async () => {
      const el = await fixture<TcAgentLedger>(html`<tc-agent-ledger look=${look} agent="Launch agent" .now=${5000}
        .entries=${[{ id: "p", action: "Changed price", target: "Pro plan", system: "Stripe", at: 1000, change: ["$29", "$34"] }]}></tc-agent-ledger>`);
      expect(el.querySelector("span[aria-label]")).toBeNull();
      expect(el.querySelector(".ui-alg__change")!.textContent!.replace(/<!--.*?-->/g, "").replace(/\s+/g, " ").trim()).toBe("$29→ to $34");
      expect(el.querySelector(".ui-alg__target")!.getAttribute("title")).toBe("Pro plan");
      expect(el.querySelector(".ui-alg__agent")!.getAttribute("title")).toBe("Launch agent");
    });

    test("a removed entry hands focus on to another row's action, not <body>", async () => {
      const el = await fixture<TcAgentLedger>(html`<tc-agent-ledger look=${look} .entries=${entries} .now=${5000}></tc-agent-ledger>`);
      button(el, /^Undo: Added coupon/)!.focus();
      el.entries = entries.filter((e) => e.id !== "x");
      await settle();
      await new Promise((r) => setTimeout(r));
      expect(document.activeElement?.className).toMatch(/__act/);
    });

    test("a logo element is cloned into the row; without one the system's initial shows", async () => {
      const logo = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      logo.setAttribute("data-mine", "");
      const el = await fixture<TcAgentLedger>(html`<tc-agent-ledger look=${look} .now=${5000}
        .entries=${[{ id: "a", action: "A", system: "Stripe", at: 1, icon: logo }, { id: "b", action: "B", system: "Mail", at: 2 }]}></tc-agent-ledger>`);
      const icons = [...el.querySelectorAll(".ui-alg__icon")];
      expect(icons[1].querySelector("svg[data-mine]")).toBeTruthy();
      expect(icons[0].textContent).toBe("M");
      expect(logo.isConnected).toBe(false);
    });
  });
}

test("without a clock it reads the time itself, and stops when removed", async () => {
  const set = vi.spyOn(window, "setInterval");
  const clear = vi.spyOn(window, "clearInterval");
  const el = await fixture<TcAgentLedger>(html`<tc-agent-ledger .entries=${[{ id: "a", action: "A", system: "S", at: Date.now() - 5 * 60_000 }]}></tc-agent-ledger>`);
  expect(el.querySelector(".ui-alg__time")!.textContent).toMatch(/^5m ago/);
  expect(set).toHaveBeenCalled();
  el.remove();
  expect(clear).toHaveBeenCalled();
  set.mockRestore();
  clear.mockRestore();
});

test("axe: no violations in either look", async () => {
  const wrap = await fixture(html`<div>
    <tc-agent-ledger agent="Launch agent" .entries=${entries} .now=${5000} .undone=${["c"]}></tc-agent-ledger>
    <tc-agent-ledger look="clean" heading="Clean" .entries=${entries} .now=${5000}></tc-agent-ledger>
  </div>`);
  // The "1 undone" count fades in – check it as it ends up
  for (const a of document.getAnimations()) a.finish();
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
