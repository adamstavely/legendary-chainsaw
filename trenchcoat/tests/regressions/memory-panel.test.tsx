/*
 * Phase 3 memory-panel: whether onChange was passed used to decide who held the list (an analytics callback froze
 * the panel, and a `memories` prop without one was copied once and then ignored). Now `memories` defined means
 * controlled, `defaultMemories` is uncontrolled, and the granular callbacks may be async and roll back on failure.
 */
import { Profiler } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/memory-panel";
import * as clean from "@components/memory-panel-clean";
import type { Memory } from "@components/memory-panel";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const tea: Memory = { id: "a", text: "Likes tea", category: "Preferences" };
const berlin: Memory = { id: "b", text: "Works in Berlin", category: "Work" };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const texts = (container: HTMLElement) => [...container.querySelectorAll(".ui-mp__text")].map((el) => el.textContent);
const settle = async (ms = 400) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

for (const [style, ui] of styles) {
  const { MemoryPanel } = ui;

  describe(`memory-panel (${style})`, () => {
    test("uncontrolled with onChange: the panel still applies the change and reports it", async () => {
      const onChange = vi.fn();
      const { container } = render(<MemoryPanel defaultMemories={[tea, berlin]} onChange={onChange} />);
      fireEvent.click(screen.getByRole("button", { name: "Pause “Likes tea”" }));
      expect(onChange).toHaveBeenLastCalledWith([{ ...tea, paused: true }, berlin]);
      expect(container.querySelector('[data-memory="a"]')!.hasAttribute("data-paused")).toBe(true);
    });

    test("controlled without onChange: a new memories prop is shown (not copied once and ignored)", () => {
      const { container, rerender } = render(<MemoryPanel memories={[tea]} />);
      expect(texts(container)).toEqual(["Likes tea"]);
      rerender(<MemoryPanel memories={[tea, berlin]} />);
      expect(texts(container).sort()).toEqual(["Likes tea", "Works in Berlin"]);
    });

    test("controlled: a change is reported, not applied", () => {
      const onChange = vi.fn();
      const { container } = render(<MemoryPanel memories={[tea]} onChange={onChange} />);
      fireEvent.click(screen.getByRole("button", { name: "Pause “Likes tea”" }));
      expect(onChange).toHaveBeenCalledWith([{ ...tea, paused: true }]);
      expect(container.querySelector('[data-memory="a"]')!.hasAttribute("data-paused")).toBe(false);
    });

    test("a rejected onPause rolls the change back and says so", async () => {
      let fail!: (e: Error) => void;
      const onPause = vi.fn(() => new Promise((_, reject) => (fail = reject)));
      const { container } = render(<MemoryPanel defaultMemories={[tea]} onPause={onPause} />);
      fireEvent.click(screen.getByRole("button", { name: "Pause “Likes tea”" }));
      const row = () => container.querySelector<HTMLElement>('[data-memory="a"]')!;
      expect(row().hasAttribute("data-paused")).toBe(true);
      expect(row().getAttribute("aria-busy")).toBe("true");
      await act(async () => fail(new Error("offline")));
      expect(row().hasAttribute("data-paused")).toBe(false);
      expect(row().hasAttribute("aria-busy")).toBe(false);
      expect(container.querySelector(".ui-mp__caption")!.textContent).toMatch(/Couldn't pause it/);
    });

    test("a rejected onForget brings the memory back", async () => {
      const onForget = vi.fn(() => Promise.reject(new Error("offline")));
      const { container } = render(<MemoryPanel defaultMemories={[tea, berlin]} onForget={onForget} />);
      fireEvent.click(screen.getByRole("button", { name: "Forget “Likes tea”" }));
      await settle();
      await settle(100);
      expect(onForget).toHaveBeenCalledWith("a");
      expect(texts(container).sort()).toEqual(["Likes tea", "Works in Berlin"]);
      expect(container.querySelector(".ui-mp__caption")!.textContent).toMatch(/Couldn't forget it/);
    });

    test("Enter while composing (IME) doesn't save a new memory", () => {
      const onAdd = vi.fn();
      render(<MemoryPanel defaultMemories={[tea]} onAdd={onAdd} />);
      fireEvent.click(screen.getByRole("button", { name: "New memory" }));
      const box = screen.getByRole("textbox", { name: "New memory" });
      fireEvent.change(box, { target: { value: "日本語" } });
      fireEvent.keyDown(box, { key: "Enter", isComposing: true });
      expect(onAdd).not.toHaveBeenCalled();
      fireEvent.keyDown(box, { key: "Enter" });
      expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ text: "日本語", category: "Preferences" }));
    });
  });
}

/* Phase 4 – the counts roll in the DOM: a roll costs a commit when it starts and one when it ends, not one a frame */
for (const [style, ui] of styles) {
  const { MemoryPanel } = ui;
  test(`memory-panel (${style}): rolling counts don't re-render every frame`, async () => {
    let commits = 0;
    const { container } = render(
      <Profiler id="m" onRender={() => commits++}>
        <MemoryPanel defaultMemories={[tea, berlin]} />
      </Profiler>,
    );
    const before = commits;
    fireEvent.click(screen.getByRole("button", { name: "Pause “Likes tea”" }));
    for (let i = 0; i < 40; i++) await settle(16);
    expect(commits - before).toBeLessThanOrEqual(4);
    expect(container.querySelector('[class*="__caption"]')!.textContent).toContain("2 memories · 1 paused");
  });
}

/* WCAG fix pass: Forget made the focused row inert (focus lost, 2.4.3); Undo expired after 5 s whatever you did
   (2.2.1); the caption was a live region of rolling numbers (4.1.3) */
for (const [style, ui] of styles) {
  describe(`memory-panel ${style} – focus, timing, announcements`, () => {
    const forgetOf = (text: string) => screen.getByRole("button", { name: `Forget “${text}”` });

    test("Forget moves focus to the next memory's Forget before the row folds", async () => {
      render(<ui.MemoryPanel defaultMemories={[tea, berlin]} />);
      act(() => forgetOf("Likes tea").focus());
      fireEvent.click(forgetOf("Likes tea"));
      expect(document.activeElement).toBe(forgetOf("Works in Berlin"));
      await settle();
      expect(document.activeElement).toBe(forgetOf("Works in Berlin"));
    });

    test("forgetting the last memory moves focus to New memory, not <body>", async () => {
      const { container } = render(<ui.MemoryPanel defaultMemories={[tea]} />);
      act(() => forgetOf("Likes tea").focus());
      fireEvent.click(forgetOf("Likes tea"));
      await settle();
      expect(document.activeElement).toBe(container.querySelector(".ui-mp__add"));
    });

    test("Undo waits while focus is on it and starts its full time over after", async () => {
      const { container } = render(<ui.MemoryPanel defaultMemories={[tea, berlin]} undoFor={1000} />);
      fireEvent.click(forgetOf("Likes tea"));
      await settle();
      const undo = screen.getByRole("button", { name: "Undo" });
      act(() => undo.focus());
      await settle(3000);
      expect(screen.getByRole("button", { name: "Undo" })).toBe(undo);
      act(() => (container.querySelector(".ui-mp__add") as HTMLElement).focus());
      await settle(600);
      expect(screen.queryByRole("button", { name: "Undo" })).not.toBeNull();
      await settle(600);
      expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    });

    test("undoFor={Infinity} keeps Undo; the status region says what was forgotten", async () => {
      const { container } = render(<ui.MemoryPanel defaultMemories={[tea, berlin]} undoFor={Infinity} />);
      const region = container.querySelector('[role="status"]')!;
      expect(region.textContent).toBe("");
      expect(container.querySelector("[aria-live]")).toBeNull();
      fireEvent.click(forgetOf("Likes tea"));
      await settle(10_000);
      expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
      expect(region.textContent).toBe("Forgot “Likes tea”. Undo is on the tray.");
    });
  });
}
