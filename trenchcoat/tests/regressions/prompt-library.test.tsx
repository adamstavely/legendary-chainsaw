/*
 * prompt-library: "Copied to clipboard" showed even when the clipboard refused the write. The Use handler was a
 * local function named `use`, which the hooks lint rule mistook for React's use().
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as promptStandard from "@components/prompt-library";
import * as promptClean from "@components/prompt-library-clean";

const styles = <S, C>(standard: S, clean: C) =>
  [
    ["standard", standard],
    ["clean", clean],
  ] as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const flush = () => act(async () => {});

const templates = [{ id: "t1", title: "Summary", body: "Summarize the meeting in three bullets." }];

for (const [style, ui] of styles(promptStandard, promptClean)) {
  const { PromptLibrary } = ui;
  describe(`prompt-library (${style})`, () => {
    test("a failed clipboard write never says Copied and doesn't call onCopy", async () => {
      vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
      const onCopy = vi.fn();
      render(<PromptLibrary templates={templates} onCopy={onCopy} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy prompt" }));
      await flush();
      expect(screen.queryByText("Copied to clipboard")).toBeNull();
      expect(screen.getByText("Couldn't copy")).toBeTruthy();
      expect(onCopy).not.toHaveBeenCalled();
    });

    test("a successful copy says so and calls onCopy", async () => {
      const onCopy = vi.fn();
      render(<PromptLibrary templates={templates} onCopy={onCopy} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy prompt" }));
      await flush();
      expect(screen.getByText("Copied to clipboard")).toBeTruthy();
      expect(onCopy).toHaveBeenCalledWith("Summarize the meeting in three bullets.");
    });

    test("Use still sends the finished prompt", () => {
      const onUse = vi.fn();
      render(<PromptLibrary templates={templates} onUse={onUse} useLabel="Use it" />);
      fireEvent.click(screen.getByRole("button", { name: /Use it/ }));
      expect(onUse).toHaveBeenCalledWith("Summarize the meeting in three bullets.", templates[0], expect.any(Object));
    });

    // Phase 3: one API contract
    const vars = [
      { id: "a", title: "Email", body: "Write to {name} about {topic}.", variables: { topic: { default: "pricing" } } },
      { id: "b", title: "Recap", body: "Recap for {team}." },
    ];
    const field = (name: string) => document.querySelector<HTMLInputElement>(`.ui-pli__panel:not([data-out]) [data-var="${name}"]`)!;

    test("variable values are controllable: typing is reported with every template's values", () => {
      const onValuesChange = vi.fn();
      const { rerender } = render(<PromptLibrary templates={vars} values={{ a: { name: "Ana" } }} onValuesChange={onValuesChange} />);
      expect(field("name").value).toBe("Ana");
      expect(field("topic").value).toBe("pricing"); // missing → template default
      fireEvent.change(field("name"), { target: { value: "Bo" } });
      expect(onValuesChange).toHaveBeenLastCalledWith({ a: { name: "Bo", topic: "pricing" } });
      expect(field("name").value).toBe("Ana");
      rerender(<PromptLibrary templates={vars} values={{ a: { name: "Cy", topic: "renewal" } }} onValuesChange={onValuesChange} />);
      expect(field("name").value).toBe("Cy");
      expect(field("topic").value).toBe("renewal");
    });

    test("uncontrolled values start at defaultValues and are kept per template", () => {
      const onValuesChange = vi.fn();
      render(<PromptLibrary templates={vars} defaultValues={{ b: { team: "Ops" } }} onValuesChange={onValuesChange} />);
      fireEvent.change(field("name"), { target: { value: "Di" } });
      expect(field("name").value).toBe("Di");
      fireEvent.click(screen.getByRole("option", { name: /Recap/ }));
      expect(field("team").value).toBe("Ops");
      expect(onValuesChange).toHaveBeenLastCalledWith({ b: { team: "Ops" }, a: { name: "Di", topic: "pricing" } });
    });

    test("an async onUse keeps Use pending and says so when it fails", async () => {
      let fail!: (e: Error) => void;
      const onUse = vi.fn(() => new Promise((_, reject) => (fail = reject)));
      render(<PromptLibrary templates={templates} onUse={onUse} />);
      const use = () => screen.getByRole("button", { name: /Use prompt/ });
      fireEvent.click(use());
      expect(use().getAttribute("aria-busy")).toBe("true");
      fireEvent.click(use());
      expect(onUse).toHaveBeenCalledTimes(1);
      await act(async () => fail(new Error("offline")));
      expect(use().hasAttribute("aria-busy")).toBe(false);
      expect(screen.getAllByText("Couldn't use the prompt").length).toBeGreaterThan(0);
    });

    test("Enter while composing (IME) doesn't move on or use the prompt", () => {
      const onUse = vi.fn();
      render(<PromptLibrary templates={[vars[1]]} onUse={onUse} />);
      fireEvent.change(field("team"), { target: { value: "営業" } });
      fireEvent.keyDown(field("team"), { key: "Enter", isComposing: true });
      expect(onUse).not.toHaveBeenCalled();
      fireEvent.keyDown(field("team"), { key: "Enter" });
      expect(onUse).toHaveBeenCalledWith("Recap for 営業.", vars[1], { team: "営業" });
    });
  });
}

/* WCAG fix pass: the reason Use was off lived only in a hover caption; pressing it did nothing audible */
for (const [style, ui] of styles(promptStandard, promptClean)) {
  const { PromptLibrary } = ui;
  describe(`prompt-library (${style}) – Use explains itself`, () => {
    const vars = [{ id: "v", title: "Mail", body: "Write to {name} about {topic}." }];

    test("Use, while off, is described by the reason and says it when pressed", () => {
      const onUse = vi.fn();
      const { container } = render(<PromptLibrary templates={vars} onUse={onUse} />);
      const use = screen.getByRole("button", { name: /Use prompt/ });
      expect(use.getAttribute("aria-disabled")).toBe("true");
      const why = document.getElementById(use.getAttribute("aria-describedby")!);
      expect(why?.textContent).toBe("Fill 2 more variables to use");
      act(() => use.click());
      expect(onUse).not.toHaveBeenCalled();
      expect(container.querySelector('[role="status"]')!.textContent).toBe("Fill 2 more variables to use the prompt");
    });

    test("once every variable is filled, Use has no reason attached and works", () => {
      const onUse = vi.fn();
      render(<PromptLibrary templates={vars} defaultValues={{ v: { name: "Ana", topic: "Q3" } }} onUse={onUse} />);
      const use = screen.getByRole("button", { name: /Use prompt/ });
      expect(use.getAttribute("aria-disabled")).toBe("false");
      expect(use.hasAttribute("aria-describedby")).toBe(false);
      act(() => use.click());
      expect(onUse).toHaveBeenCalledWith("Write to Ana about Q3.", vars[0], { name: "Ana", topic: "Q3" });
    });

    test("the status region is there from mount", () => {
      const { container } = render(<PromptLibrary templates={vars} />);
      expect(container.querySelector('[role="status"]')!.textContent).toBe("");
    });
  });
}
