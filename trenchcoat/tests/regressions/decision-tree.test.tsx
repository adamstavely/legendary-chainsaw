/* decision-tree: a rejected "Other…" send lets go of the pick, says so, keeps the instruction and can be retried (H5 follow-up) */
import { createRef } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/decision-tree";
import * as clean from "@components/decision-tree-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const advance = async (ms: number, step = 100) => {
  for (let t = 0; t < ms; t += step) {
    await act(async () => {
      vi.advanceTimersByTime(step);
    });
  }
};

const decision = {
  id: "d1",
  question: "Roll back the release?",
  agent: "Release agent",
  options: [{ label: "Roll back" }, { label: "Keep it live" }],
};

for (const [style, ui] of styles) {
  describe(`decision-tree ${style}`, () => {
    test("a failed send shows an error, keeps the text, and a retry goes through", async () => {
      const onChoose = vi.fn().mockRejectedValueOnce(new Error("network down")).mockResolvedValue("On it.");
      const ref = createRef<standard.DecisionTreeHandle>();
      const { container } = render(<ui.DecisionTree ref={ref} decisions={[decision]} onChoose={onChoose} />);
      await act(async () => ref.current!.setOther("Wait for the hotfix instead"));
      await act(async () => ref.current!.send());
      await advance(200);

      const field = screen.getByRole<HTMLTextAreaElement>("textbox");
      expect(field.value).toBe("Wait for the hotfix instead");
      expect(field.getAttribute("aria-invalid")).toBe("true");
      expect(document.getElementById(field.getAttribute("aria-describedby")!)?.textContent).toMatch(/Couldn't send/);
      expect(container.querySelector('[aria-live="polite"]')?.textContent).toMatch(/Couldn't send to the release agent/);

      // Retry: the same instruction goes out again, and this time the answer arrives
      await act(async () => ref.current!.send());
      await advance(1000);
      expect(onChoose).toHaveBeenCalledTimes(2);
      expect(onChoose.mock.lastCall![1]).toEqual({ other: "Wait for the hotfix instead" });
      expect(screen.queryByText(/Couldn't send/)).toBeNull();
      expect(screen.getByText("On it.")).toBeTruthy();
    });

    test("an onChoose that throws is handled like one that rejects", async () => {
      const onChoose = vi.fn(() => {
        throw new Error("boom");
      });
      const ref = createRef<standard.DecisionTreeHandle>();
      render(<ui.DecisionTree ref={ref} decisions={[decision]} onChoose={onChoose} />);
      await act(async () => ref.current!.setOther("Something else"));
      await act(async () => ref.current!.send());
      await advance(200);
      expect(screen.getAllByText(/Couldn't send/).length).toBeGreaterThan(0);
    });

    test("a rejected branch pick lets go of the pick, says so, and a second pick goes through", async () => {
      const onChoose = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
      const { container } = render(<ui.DecisionTree decisions={[decision]} onChoose={onChoose} />);
      await act(async () => screen.getByRole("button", { name: "Roll back" }).click());
      await advance(200);
      expect(container.querySelector(".ui-dct__tree[data-picked]")).toBeNull();
      expect(container.querySelector(".ui-dct__sr")!.textContent).toMatch(/Couldn't pass/);
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Roll back" }).disabled).toBe(false);
      await act(async () => screen.getByRole("button", { name: "Keep it live" }).click());
      await advance(2500);
      expect(onChoose).toHaveBeenCalledTimes(2);
      expect(container.querySelector(".ui-dct__count")!.textContent).toBe("1 of 1 decided");
    });

    test("decision: controlled shows the prop, paging reports instead", async () => {
      const second = { ...decision, id: "d2", question: "Refund the customer?" };
      const onDecisionChange = vi.fn();
      const { container } = render(<ui.DecisionTree decisions={[decision, second]} decision="d2" onDecisionChange={onDecisionChange} />);
      expect(container.querySelector(".ui-dct__q")!.textContent).toBe("Refund the customer?");
      const root = container.querySelector<HTMLElement>(".ui-dct")!;
      await act(async () => root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
      expect(onDecisionChange).toHaveBeenCalledWith("d1");
      expect(container.querySelector(".ui-dct__q")!.textContent).toBe("Refund the customer?");
    });
  });
}

/*
 * WCAG + design pass (f7): option names come from their visible text (no aria-label replacing it – axe
 * label-content-name-mismatch) and their consequences, flagged notes included, are their description; flagged parts
 * aren't tab stops nested in buttons; previous/next buttons page the decisions for the pointer and screen readers;
 * focus never drops to <body> when a pick disables the focused option; Escape in "Other…" goes back to its button;
 * a hover note stays while hovered and closes with Escape.
 */
const followUp = {
  id: "f1",
  question: "Pause the campaign?",
  agent: "Growth agent",
  options: [
    {
      label: "Pause it",
      pick: true,
      next: {
        question: "For how long?",
        options: [
          { label: "A day", effects: ["Resumes tomorrow"], pick: true },
          { label: "A week", effects: [["Not reversible – ", { text: "the slot is lost", note: "The ad slot is resold after 3 days.", source: "ads · terms" }]] },
        ],
      },
    },
    { label: "Keep it running", effects: [["Spends ", { text: "$40 more today", note: "At today's rate.", source: "ads · spend" }]] },
  ],
};

for (const [style, ui] of styles) {
  describe(`decision-tree ${style} – a11y pass`, () => {
    test("options are named by their text, described by their consequences and notes", () => {
      render(<ui.DecisionTree decisions={[followUp]} />);
      const keep = screen.getByRole("button", { name: "Keep it running" });
      expect(keep.hasAttribute("aria-label")).toBe(false);
      const desc = document.getElementById(keep.getAttribute("aria-describedby")!)!.textContent;
      expect(desc).toContain("$40 more today");
      expect(desc).toContain("the agent is unsure: At today's rate. Source: ads · spend");
      // The agent's pick is part of the visible text, so of the name
      expect(screen.getByRole("button", { name: "Pause it Agent's pick" })).toBeTruthy();
      // A follow-up option: named by its top line, its consequences (notes too) describe it
      const week = screen.getByRole("button", { name: "A week" });
      expect(document.getElementById(week.getAttribute("aria-describedby")!)!.textContent).toContain("the slot is lost (the agent is unsure: The ad slot is resold");
      for (const mark of document.querySelectorAll("mark")) {
        expect(mark.hasAttribute("tabindex")).toBe(false);
        expect(mark.hasAttribute("aria-label")).toBe(false);
      }
    });

    test("picking a branch with a follow-up moves focus to its first option, a final pick to the card – never <body>", async () => {
      const { container } = render(<ui.DecisionTree decisions={[followUp, decision]} />);
      const pause = screen.getByRole("button", { name: "Pause it Agent's pick" });
      pause.focus();
      await act(async () => pause.click());
      expect(document.activeElement).not.toBe(document.body);
      expect((document.activeElement as HTMLElement).textContent).toContain("A day");
      await act(async () => (document.activeElement as HTMLButtonElement).click());
      expect(document.activeElement).not.toBe(document.body);
      expect(container.querySelector(".ui-dct")!.contains(document.activeElement)).toBe(true);
    });

    test("previous / next buttons page the decisions; while a pick runs they stay focusable but do nothing", async () => {
      const second = { ...decision, id: "d2", question: "Refund the customer?" };
      const { container } = render(<ui.DecisionTree decisions={[decision, second]} />);
      const next = screen.getByRole("button", { name: "Next decision" });
      expect(next.getAttribute("aria-keyshortcuts")).toBe("ArrowRight J");
      await act(async () => next.click());
      expect(container.querySelector(".ui-dct__q")!.textContent).toBe("Refund the customer?");
      expect(screen.getByText(/2 of 2/)).toBeTruthy();
      await act(async () => screen.getByRole("button", { name: "Previous decision" }).click());
      expect(container.querySelector(".ui-dct__q")!.textContent).toBe("Roll back the release?");
      await act(async () => screen.getByRole("button", { name: "Roll back" }).click());
      expect(next.getAttribute("aria-disabled")).toBe("true");
      next.focus();
      await act(async () => next.click());
      expect(document.activeElement).toBe(next);
      expect(container.querySelector(".ui-dct__q")!.textContent).toBe("Roll back the release?");
    });

    test("Escape in the Other… field closes it and returns focus to its button", async () => {
      render(<ui.DecisionTree decisions={[decision]} />);
      await act(async () => screen.getByRole("button", { name: "Other…" }).click());
      await advance(100);
      const field = screen.getByRole("textbox");
      field.focus();
      await act(async () => field.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
      await advance(100);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Other…" }));
    });

    test("a note opened by pointing stays while the pointer is on it and closes with Escape", async () => {
      const { container } = render(<ui.DecisionTree decisions={[followUp]} />);
      const mark = container.querySelectorAll("mark")[1] as HTMLElement;
      await act(async () => mark.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, relatedTarget: document.body })));
      const tip = () => container.querySelector(".ui-dct__tip");
      expect(tip()?.textContent).toContain("At today's rate.");
      // Leave the part for the note itself – it stays
      await act(async () => mark.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: tip() })));
      await act(async () => tip()!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, relatedTarget: mark })));
      await advance(300);
      expect(tip()).not.toBeNull();
      await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
      expect(tip()).toBeNull();
    });

    test("the pager has no aria-label on a plain span; the typing dots are an image with a name", async () => {
      const second = { ...decision, id: "d2" };
      const { container } = render(<ui.DecisionTree decisions={[decision, second]} onChoose={() => new Promise<string>(() => {})} />);
      expect(container.querySelector(".ui-dct__pager")!.hasAttribute("aria-label")).toBe(false);
      const ref = createRef<standard.DecisionTreeHandle>();
      render(<ui.DecisionTree ref={ref} decisions={[decision]} onChoose={() => new Promise<string>(() => {})} />);
      await act(async () => ref.current!.setOther("Hold off"));
      await act(async () => ref.current!.send());
      await advance(100);
      expect(screen.getByRole("img", { name: "Release agent is typing" })).toBeTruthy();
    });
  });
}
