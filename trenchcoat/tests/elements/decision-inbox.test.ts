/*
 * <tc-decision-inbox> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/decision-inbox";
import { TcDecisionInbox, type InboxDecision, type DecisionAnswersChange } from "../../src/elements/decision-inbox";
import { cleanup, fixture, settle } from "./helpers";

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

const d1: InboxDecision = { id: "d1", title: "Merge it?", primary: "Merge", secondary: "Hold" };
const d2: InboxDecision = { id: "d2", title: "Refund it?", primary: "Refund", secondary: "Ask" };
const d3: InboxDecision = { id: "d3", title: "Rotate it?", primary: "Rotate", secondary: "Later", collapsed: true };
const head = (el: Element) => el.querySelector(".tc-head__sub")!.textContent!.replace(/\s+/g, " ").trim();
const button = (el: Element, name: string) => [...el.querySelectorAll("button")].find((b) => b.textContent!.trim() === name) ?? null;
/** Lets the fold-away timer run, then waits for the render and the focus rescue */
const advance = async (ms: number) => {
  vi.advanceTimersByTime(ms);
  await settle();
};

for (const look of ["standard", "clean"] as const) {
  describe(`tc-decision-inbox ${look}`, () => {
    test("the host is the root, with the look", async () => {
      const el = await fixture<TcDecisionInbox>(html`<tc-decision-inbox look=${look} .decisions=${[d1]}></tc-decision-inbox>`);
      expect(el.dataset.ui).toBe("di");
      expect(el.dataset.look).toBe(look);
      expect(el.hasAttribute("data-clear")).toBe(false);
    });

    test("decisions passed later join, folded when they say so", async () => {
      const el = await fixture<TcDecisionInbox>(html`<tc-decision-inbox look=${look} .decisions=${[d1]}></tc-decision-inbox>`);
      expect(head(el)).toBe("1 needs your input");
      el.decisions = [d1, d3];
      await settle();
      expect(head(el)).toBe("2 need your input");
      expect(button(el, "Rotate it?")!.classList.contains("ui-di__title--folded")).toBe(true);
    });

    test("uncontrolled: answers, reports, folds away and opens the next folded one", async () => {
      const onChange = vi.fn();
      const el = await fixture<TcDecisionInbox>(html`<tc-decision-inbox look=${look} .decisions=${[d1, d3]} @tc-answers-change=${(e: CustomEvent<DecisionAnswersChange>) => onChange(e.detail.answers)}></tc-decision-inbox>`);
      button(el, "Merge")!.click();
      await settle();
      expect(onChange).toHaveBeenCalledWith({ d1: "primary" });
      expect(el.answers).toEqual({ d1: "primary" });
      expect(head(el)).toBe("1 needs your input");
      await advance(1200);
      expect(el.querySelector(".ui-di__row[data-gone]")).toBeTruthy();
      expect(button(el, "Rotate it?")).toBeNull();
    });

    test("controlled answers: a prevented click is reported, not applied; passing an answer shows it", async () => {
      const onChange = vi.fn();
      const el = await fixture<TcDecisionInbox>(html`<tc-decision-inbox
        look=${look}
        .decisions=${[d1, d2]}
        @tc-answers-change=${(e: CustomEvent<DecisionAnswersChange>) => {
          e.preventDefault();
          onChange(e.detail.answers);
        }}
      ></tc-decision-inbox>`);
      button(el, "Hold")!.click();
      await settle();
      expect(onChange).toHaveBeenCalledWith({ d1: "secondary" });
      expect(head(el)).toBe("2 need your input");
      expect(el.querySelectorAll("[data-answered]")).toHaveLength(0);
      el.answers = { d2: "primary" };
      await settle();
      expect(head(el)).toBe("1 needs your input");
      expect(el.querySelector(".ui-di__done")!.textContent!.trim()).toBe("Refund");
    });

    test("answers set before the first render start folded away", async () => {
      const el = await fixture<TcDecisionInbox>(html`<tc-decision-inbox look=${look} .decisions=${[d1, d2]} .answers=${{ d1: "primary" }}></tc-decision-inbox>`);
      expect(el.querySelector('.ui-di__row[data-id="d1"]')!.hasAttribute("data-gone")).toBe(true);
      expect(head(el)).toBe("1 needs your input");
    });

    test("a rejected decide says so and leaves the buttons to try again", async () => {
      const decide = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
      const decided = vi.fn();
      const el = await fixture<TcDecisionInbox>(html`<tc-decision-inbox look=${look} .decisions=${[d1]} .decide=${decide} @tc-decide=${decided}></tc-decision-inbox>`);
      button(el, "Merge")!.click();
      await settle();
      expect(decide).toHaveBeenCalledWith(d1, "primary");
      expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/try again/);
      expect(head(el)).toBe("1 needs your input");
      expect(decided).not.toHaveBeenCalled();
      button(el, "Merge")!.click();
      await settle();
      expect(el.querySelector('[role="alert"]')).toBeNull();
      expect(head(el)).toBe("All caught up");
      expect(el.hasAttribute("data-clear")).toBe(true);
      expect(decided).toHaveBeenCalledTimes(1);
    });

    test("a pending decide holds the row: busy, buttons aria-disabled, a second click ignored", async () => {
      let resolve!: () => void;
      const decide = vi.fn(() => new Promise<void>((r) => (resolve = r)));
      const el = await fixture<TcDecisionInbox>(html`<tc-decision-inbox look=${look} .decisions=${[d1]} .decide=${decide}></tc-decision-inbox>`);
      button(el, "Merge")!.click();
      await settle();
      expect(el.querySelector(".ui-di__item")!.getAttribute("aria-busy")).toBe("true");
      expect(button(el, "Hold")!.getAttribute("aria-disabled")).toBe("true");
      button(el, "Hold")!.click();
      expect(decide).toHaveBeenCalledTimes(1);
      resolve();
      await settle();
      expect(el.answers).toEqual({ d1: "primary" });
    });

    test("removing the element during the confirmation leaves no timer behind", async () => {
      const el = await fixture<TcDecisionInbox>(html`<tc-decision-inbox look=${look} .decisions=${[d1]}></tc-decision-inbox>`);
      button(el, "Merge")!.click();
      await settle();
      expect(vi.getTimerCount()).toBe(1);
      el.remove();
      expect(vi.getTimerCount()).toBe(0);
    });

    test("WCAG 2.4.3: answering moves focus to the answer, folding away to the next decision", async () => {
      const el = await fixture<TcDecisionInbox>(html`<tc-decision-inbox look=${look} .decisions=${[d1, d2]}></tc-decision-inbox>`);
      const merge = button(el, "Merge")!;
      merge.focus();
      merge.click();
      await settle();
      expect(document.activeElement).toBe(el.querySelector(".ui-di__done"));
      await advance(1200);
      expect(document.activeElement).toBe(button(el, "Refund"));
    });

    test("WCAG 2.4.3 / 4.1.2: a folded title says it's collapsed and opening it focuses its first answer", async () => {
      const el = await fixture<TcDecisionInbox>(html`<tc-decision-inbox look=${look} .decisions=${[d1, d3]}></tc-decision-inbox>`);
      const title = button(el, "Rotate it?")!;
      expect(title.getAttribute("aria-expanded")).toBe("false");
      const body = document.getElementById(title.getAttribute("aria-controls")!)!;
      expect(body.hasAttribute("inert")).toBe(true);
      title.focus();
      title.click();
      await settle();
      expect(body.hasAttribute("inert")).toBe(false);
      expect(document.activeElement).toBe(button(el, "Rotate"));
      expect(el.querySelectorAll(".ui-di__body[inert]")).toHaveLength(0);
    });

    test("WCAG 2.4.3: the last answer folding away leaves focus in the element, not on <body>", async () => {
      const el = await fixture<TcDecisionInbox>(html`<tc-decision-inbox look=${look} .decisions=${[d1]}></tc-decision-inbox>`);
      const merge = button(el, "Merge")!;
      merge.focus();
      merge.click();
      await settle();
      await advance(1200);
      expect(document.activeElement).not.toBe(document.body);
      expect(el.contains(document.activeElement)).toBe(true);
    });

    test("WCAG 4.1.3: the count is a live region from the first render", async () => {
      const el = await fixture<TcDecisionInbox>(html`<tc-decision-inbox look=${look}></tc-decision-inbox>`);
      expect(el.querySelector('.ui-di__sr[role="status"]')!.textContent).toBe("All caught up");
      expect(head(el)).toBe("All caught up");
    });

    test("keyboard: the answers and folded titles are native buttons in the tab order", async () => {
      const el = await fixture<TcDecisionInbox>(html`<tc-decision-inbox look=${look} .decisions=${[d1]}></tc-decision-inbox>`);
      const merge = button(el, "Merge")!;
      expect(merge.type).toBe("button");
      expect(merge.tabIndex).toBe(0);
    });
  });
}

test("theme and primary: no .dark-scoped colours, answers use the action tokens", () => {
  const css = TcDecisionInbox.css;
  expect(css).not.toMatch(/\.dark[^{}]*\.ui-di__/);
  expect(css).not.toMatch(/linear-gradient/);
  expect(css).toMatch(/\.ui-di__btn--primary \{[^}]*--tc-action-primary-bg/);
});

test("axe: no violations in either look", async () => {
  vi.useRealTimers();
  const wrap = await fixture(html`<div>
    <tc-decision-inbox .decisions=${[d1, d2, d3]}></tc-decision-inbox>
    <tc-decision-inbox look="clean" .decisions=${[d1, d2, d3]}></tc-decision-inbox>
  </div>`);
  // The heading text fades in; axe measures contrast on the settled colours
  await Promise.all(document.getAnimations().map((a) => a.finished));
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
