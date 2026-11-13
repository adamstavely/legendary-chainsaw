/*
 * <tc-moderation-queue> in real browsers: the item (reason, policy, conversation with the reported reply), decisions by
 * button and key, the note needed to remove or restrict, moving on, Undo, controlled use, the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/moderation-queue";
import type { ModerationDecide, ModerationDecisionsChange, ModerationItem, ModerationVerdict, TcModerationQueue } from "../../src/elements/moderation-queue";
import { ModerationQueue } from "../../src/elements/react/moderation-queue";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ITEMS: ModerationItem[] = [
  {
    id: "r1",
    reason: "Unsafe advice",
    reportedBy: "Tom Becker",
    at: Date.UTC(2026, 10, 12, 12),
    agent: "Policy Q&A",
    user: "Jordan Ellis",
    policy: { name: "Financial advice policy", excerpt: "Agents explain policy; they don't advise on personal tax." },
    turns: [
      { id: "t1", from: "user", author: "Jordan Ellis", text: "Can I claim my home office?" },
      { id: "t2", from: "assistant", text: "Yes – claim the full rent; nobody checks.", reported: true },
    ],
  },
  {
    id: "r2",
    reason: "Private data",
    automated: { classifier: "Personal data detector", score: 0.91 },
    agent: "Policy Q&A",
    user: "Mei Tanaka",
    turns: [{ id: "t1", from: "assistant", text: "Her home address is 14 Harbour Lane.", reported: true }],
  },
  {
    id: "r3",
    reason: "Off-topic",
    reportedBy: "Priya Shah",
    turns: [{ id: "t1", from: "assistant", text: "The per-diem is 95 a day.", reported: true }],
  },
];

const decideBtn = (el: Element, d: string) => el.querySelector<HTMLButtonElement>(`.ui-mdq__decide[data-decision="${d}"]`)!;
const note = (el: Element) => el.querySelector<HTMLTextAreaElement>(".ui-mdq__note")!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const typeNote = (el: Element, text: string) => {
  note(el).value = text;
  note(el).dispatchEvent(new Event("input", { bubbles: true }));
};
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcModerationQueue>(html`<tc-moderation-queue look=${look} description="Policy questions, this week" .items=${ITEMS} locale="en-GB"></tc-moderation-queue>`);

describe("tc-moderation-queue", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the item – who reported it, the policy, the conversation with the reported reply marked – and progress`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("mdq");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-mdq__waiting")!.textContent).toBe("3 waiting");
      expect(el.querySelector(".ui-mdq__where")!.textContent).toBe("Item 1 of 3 · 0 decided");
      const item = el.querySelector("article.ui-mdq__item")!;
      expect(document.getElementById(item.getAttribute("aria-labelledby")!)!.textContent).toBe("Unsafe advice");
      expect(el.querySelector(".ui-mdq__who")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Reported by Tom Becker");
      expect(el.querySelector(".ui-mdq__policy-name")!.textContent).toBe("May break: Financial advice policy");
      const turns = [...el.querySelectorAll(".ui-mdq__turn")];
      expect(turns.map((t) => t.hasAttribute("data-reported"))).toEqual([false, true]);
      expect(turns[1].querySelector(".ui-mdq__author")!.textContent).toBe("Policy Q&AReported reply");
      expect(el.querySelector(".ui-mdq__turns")!.getAttribute("aria-label")).toBe("Conversation");
      expect([...el.querySelectorAll(".ui-mdq__decide")].map((b) => b.getAttribute("aria-keyshortcuts"))).toEqual(["K", "R", "U", "E"]);
      expect(decideBtn(el, "restrict").textContent!.replace(/\s+/g, " ").trim()).toBe("Restrict user Jordan EllisU");
    });
  }

  test("an automatic flag shows the classifier and its score in a word and a number", async () => {
    const el = await make();
    el.index = 1;
    await settle();
    expect(el.querySelector(".ui-mdq__who")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Flagged automatically · Personal data detector High, 0.91");
  });

  test("Keep decides and opens the next waiting item; tc-decide and tc-decisions-change carry it", async () => {
    const el = await make();
    const decided: ModerationDecide[] = [];
    const changes: ModerationDecisionsChange[] = [];
    el.addEventListener("tc-decide", (e) => decided.push((e as CustomEvent<ModerationDecide>).detail));
    el.addEventListener("tc-decisions-change", (e) => changes.push((e as CustomEvent<ModerationDecisionsChange>).detail));
    decideBtn(el, "keep").click();
    await settle();
    expect(decided.map((d) => [d.id, d.decision, d.note])).toEqual([["r1", "keep", ""]]);
    expect(changes[0].decisions).toEqual({ r1: { decision: "keep" } });
    expect(el.index).toBe(1);
    expect(status(el)).toBe("Kept. Item 2 of 3: Private data");
    expect(el.querySelector(".ui-mdq__waiting")!.textContent).toBe("2 waiting");
  });

  test("Remove and Restrict need a note: without one the note field asks, with one it decides", async () => {
    const el = await make();
    decideBtn(el, "remove").click();
    await settle();
    expect(el.decisions).toEqual({});
    expect(note(el).getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(note(el).getAttribute("aria-describedby")!)!.textContent).toBe("Add a note to remove this reply");
    await expect.poll(() => document.activeElement).toBe(note(el));
    typeNote(el, "Gives tax advice the policy rules out");
    await settle();
    expect(note(el).getAttribute("aria-invalid")).toBe("false");
    decideBtn(el, "remove").click();
    await settle();
    expect(el.decisions.r1).toEqual({ decision: "remove", note: "Gives tax advice the policy rules out" });
    // The next item starts with an empty note
    expect(note(el).value).toBe("");
    decideBtn(el, "restrict").click();
    await settle();
    expect(el.querySelector(".ui-mdq__note-error")!.textContent).toBe("Add a note to restrict Mei Tanaka");
  });

  test("keys: K E decide, N / P move, Z undoes – but not while typing in the note", async () => {
    const el = await make();
    const card = el.querySelector(".ui-mdq__card")!;
    decideBtn(el, "keep").focus();
    key(document.activeElement!, "k");
    await settle();
    expect(el.decisions.r1?.decision).toBe("keep");
    expect(el.index).toBe(1);
    key(card, "p");
    await settle();
    expect(el.index).toBe(0);
    key(card, "n");
    await settle();
    expect(el.index).toBe(1);
    // Typing an "e" in the note doesn't escalate
    key(note(el), "e");
    await settle();
    expect(el.decisions.r2).toBeUndefined();
    key(card, "e");
    await settle();
    expect(el.decisions.r2?.decision).toBe("escalate");
    expect(el.index).toBe(2);
    key(card, "z");
    await settle();
    expect(el.decisions.r2).toBeUndefined();
    expect(el.index).toBe(1);
    expect(status(el)).toBe("Undone: escalated. Item 2 is waiting again");
  });

  test("the last decision says all are decided; a decided item shows its verdict and can be changed", async () => {
    const el = await make();
    decideBtn(el, "keep").click();
    await settle();
    decideBtn(el, "escalate").click();
    await settle();
    decideBtn(el, "keep").click();
    await settle();
    expect(status(el)).toBe("Kept. All 3 decided");
    expect(el.querySelector(".ui-mdq__waiting")!.textContent).toBe("All decided");
    expect(el.querySelector(".ui-mdq__verdict")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Decided: Kept – choose again to change it");
    expect(decideBtn(el, "keep").getAttribute("aria-pressed")).toBe("true");
    decideBtn(el, "escalate").click();
    await settle();
    expect(el.decisions.r3.decision).toBe("escalate");
  });

  test("controlled: a prevented tc-decide records nothing; a prevented tc-index-change stays put", async () => {
    const el = await make();
    el.addEventListener("tc-decide", (e) => e.preventDefault(), { once: true });
    decideBtn(el, "keep").click();
    await settle();
    expect(el.decisions).toEqual({});
    expect(el.index).toBe(0);
    el.addEventListener("tc-index-change", (e) => e.preventDefault());
    decideBtn(el, "keep").click();
    await settle();
    expect(el.decisions.r1.decision).toBe("keep");
    expect(el.index).toBe(0);
  });

  test("no-shortcuts turns the keys off; an empty queue says so", async () => {
    const el = await fixture<TcModerationQueue>(html`<tc-moderation-queue no-shortcuts .items=${ITEMS}></tc-moderation-queue>`);
    key(el.querySelector(".ui-mdq__card")!, "k");
    await settle();
    expect(el.decisions).toEqual({});
    expect(el.querySelector(".ui-mdq__kbd")).toBeNull();
    const empty = await fixture<TcModerationQueue>(html`<tc-moderation-queue></tc-moderation-queue>`);
    expect(empty.querySelector(".ui-mdq__empty")!.textContent).toBe("Nothing waiting – every report has been judged.");
  });

  test("narrow: the decisions go two by two and stay inside", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 340px"><tc-moderation-queue .items=${ITEMS}></tc-moderation-queue></div>`);
    const el = wrap.querySelector("tc-moderation-queue")!;
    const box = el.getBoundingClientRect();
    for (const b of el.querySelectorAll(".ui-mdq__decide")) expect(b.getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 1);
    expect(decideBtn(el, "keep").getBoundingClientRect().top).toBeLessThan(decideBtn(el, "restrict").getBoundingClientRect().top);
  });

  test("React wrapper: uncontrolled decisions survive parent re-renders; controlled ones stay until the parent changes them", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ModerationQueue, {
        title: "Reports",
        items: ITEMS,
        onDecide: (id, d) => void seen.push(["decide", id, d]),
        onIndexChange: (i) => void seen.push(["index", i]),
        "data-n": n,
      } as React.ComponentProps<typeof ModerationQueue>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-moderation-queue")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Reports");
    decideBtn(el, "keep").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.decisions.r1?.decision).toBe("keep");
    expect(el.index).toBe(1);
    expect(seen).toEqual([
      ["decide", "r1", "keep"],
      ["index", 1],
    ]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    const asked: Record<string, ModerationVerdict>[] = [];
    const refused: string[] = [];
    await act(async () =>
      root2.render(
        React.createElement(ModerationQueue, {
          items: ITEMS,
          decisions: {},
          onDecisionsChange: (d) => void asked.push(d),
          onUndo: (id) => {
            refused.push(id);
            return false;
          },
        }),
      ),
    );
    await settle();
    const el2 = host2.querySelector("tc-moderation-queue")!;
    decideBtn(el2, "keep").click();
    await settle();
    expect(asked).toEqual([{ r1: { decision: "keep" } }]);
    expect(el2.decisions).toEqual({});
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-moderation-queue description="Policy questions, this week" .items=${ITEMS} locale="en-GB"></tc-moderation-queue>
        <tc-moderation-queue look="clean" .items=${ITEMS} .index=${1}></tc-moderation-queue>
      </div>`);
      const [a, b] = wrap.querySelectorAll<TcModerationQueue>("tc-moderation-queue");
      // One asking for a note, one with a decision shown
      decideBtn(a, "remove").click();
      b.decisions = { r2: { decision: "escalate", note: "Needs the privacy team" } };
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
