/*
 * tool-call-card (Phase 3): the open-on-error change wasn't reported; Retry ignored a promise (no pending, failures
 * lost); ToolCallGroup took no ref or DOM props.
 */
import { Profiler, createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/tool-call-card";
import * as clean from "@components/tool-call-card-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

for (const [style, ui] of styles) {
  const { ToolCallCard, ToolCallGroup } = ui;
  describe(`tool-call-card (${style})`, () => {
    test("Phase 4: the live timer ticks in the DOM without re-rendering, and shows the duration once done", async () => {
      vi.useFakeTimers({ now: 0 });
      try {
        let commits = 0;
        const card = (status: "running" | "success") => (
          <Profiler id="tc" onRender={() => commits++}>
            <ToolCallCard name="search" status={status} startedAt={0} duration={status === "success" ? 2400 : undefined} />
          </Profiler>
        );
        const { container, rerender } = render(card("running"));
        const time = () => container.querySelector('[class*="__time"]')!.textContent;
        expect(time()).toBe("0.0s");
        const before = commits;
        await act(async () => {
          vi.advanceTimersByTime(1250);
        });
        expect(time()).toBe("1.2s");
        expect(commits).toBe(before);
        rerender(card("success"));
        expect(time()).toBe("2.4s");
        await act(async () => {
          vi.advanceTimersByTime(500);
        });
        expect(time()).toBe("2.4s");
      } finally {
        vi.useRealTimers();
      }
    });

    test("open-on-error opens the uncontrolled card and reports it; the next run closes it again", () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(<ToolCallCard name="search" status="running" onOpenChange={onOpenChange} />);
      const head = () => screen.getByRole("button", { name: /search/ });
      rerender(<ToolCallCard name="search" status="error" error="Timeout" onOpenChange={onOpenChange} />);
      expect(head().getAttribute("aria-expanded")).toBe("true");
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      rerender(<ToolCallCard name="search" status="running" onOpenChange={onOpenChange} />);
      expect(head().getAttribute("aria-expanded")).toBe("false");
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    test("a controlled card isn't opened on error", () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(<ToolCallCard name="search" status="running" open={false} onOpenChange={onOpenChange} />);
      rerender(<ToolCallCard name="search" status="error" open={false} onOpenChange={onOpenChange} />);
      expect(screen.getByRole("button", { name: /search/ }).getAttribute("aria-expanded")).toBe("false");
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    test("Retry waits for a promise and shows a rejection, then can be tried again", async () => {
      let fail!: (e: Error) => void;
      const onRetry = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
      render(<ToolCallCard name="search" status="error" error="Timeout" defaultOpen onRetry={onRetry} />);
      const button = screen.getByRole("button", { name: "Retry" });
      fireEvent.click(button);
      expect((button as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(button);
      expect(onRetry).toHaveBeenCalledTimes(1);
      await act(async () => fail(new Error("Rate limited")));
      expect((button as HTMLButtonElement).disabled).toBe(false);
      expect(screen.getByRole("alert").textContent).toBe("Retry failed: Rate limited");
      onRetry.mockImplementation(() => Promise.resolve());
      await act(async () => fireEvent.click(button));
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("alert")).toBeNull();
    });

    test("ToolCallGroup: className, DOM props, ref and controlled open", () => {
      const ref = createRef<HTMLDivElement>();
      const onOpenChange = vi.fn();
      const { container, rerender } = render(
        <ToolCallGroup ref={ref} className="mine" data-x="1" open={false} onOpenChange={onOpenChange}>
          <ToolCallCard name="a" status="success" duration={10} />
        </ToolCallGroup>,
      );
      const root = container.querySelector(".ui-tc-group") as HTMLElement;
      expect(ref.current).toBe(root);
      expect(root.classList.contains("mine")).toBe(true);
      expect(root.dataset.x).toBe("1");
      const head = root.querySelector(".ui-tc-group__head")!;
      fireEvent.click(head);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(head.getAttribute("aria-expanded")).toBe("false");
      rerender(
        <ToolCallGroup open onOpenChange={onOpenChange}>
          <ToolCallCard name="a" status="success" duration={10} />
        </ToolCallGroup>,
      );
      expect(head.getAttribute("aria-expanded")).toBe("true");
    });
  });
}

/* WCAG fix pass: "Copied" was only a rename of the focused button, group and cards announced the same thing twice,
   the header's name held a timer changing 10× a second, and focus fell to <body> when Retry went away (S4/S7) */
for (const [style, ui] of styles) {
  const { ToolCallCard, ToolCallGroup } = ui;
  describe(`tool-call-card (${style}) – announcements and focus`, () => {
    test("a card announces only its outcome, through a region present from mount", () => {
      const { container, rerender } = render(<ToolCallCard name="search" status="running" startedAt={0} />);
      const region = container.querySelector('[role="status"]')!;
      expect(region.textContent).toBe("");
      rerender(<ToolCallCard name="search" status="error" error="Timed out" />);
      expect(container.querySelector('[role="status"]')).toBe(region);
      expect(region.textContent).toBe("search failed: Timed out");
    });

    test("inside a group only the group speaks, once everything is done", () => {
      const group = (status: "running" | "success") => (
        <ToolCallGroup>
          <ToolCallCard name="a" status={status} duration={10} />
          <ToolCallCard name="b" status="success" duration={10} />
        </ToolCallGroup>
      );
      const { container, rerender } = render(group("running"));
      const texts = () => [...container.querySelectorAll('[role="status"]')].map((r) => r.textContent).filter(Boolean);
      expect(texts()).toEqual([]);
      rerender(group("success"));
      expect(texts()).toEqual(["Used 2 tools"]);
    });

    test("the running timer stays out of the header button's name", () => {
      const { container } = render(<ToolCallCard name="search" status="running" startedAt={0} />);
      const head = container.querySelector<HTMLButtonElement>('[aria-expanded]')!;
      expect(head.querySelector('[class*="__time"]')!.getAttribute("aria-hidden")).toBe("true");
      expect(head.textContent).toContain("running");
    });

    test("Copy keeps its name and announces Copied in a status region", async () => {
      vi.spyOn(navigator, "clipboard", "get").mockReturnValue({ writeText: vi.fn(() => Promise.resolve()) } as unknown as Clipboard);
      const { container } = render(<ToolCallCard name="search" status="success" args={{ q: 1 }} defaultOpen />);
      const copy = screen.getByRole("button", { name: "Copy arguments" });
      await act(async () => copy.click());
      expect(copy.getAttribute("aria-label")).toBe("Copy arguments");
      expect([...container.querySelectorAll('[role="status"]')].some((r) => r.textContent === "Copied")).toBe(true);
    });

    test("when Retry goes away (the call runs again) focus moves to the header, not <body>", async () => {
      const { container, rerender } = render(<ToolCallCard name="search" status="error" error="x" onRetry={() => {}} />);
      const retry = screen.getByRole("button", { name: "Retry" });
      act(() => retry.focus());
      rerender(<ToolCallCard name="search" status="running" startedAt={0} onRetry={() => {}} />);
      await act(async () => {});
      expect(document.activeElement).toBe(container.querySelector('[aria-expanded]'));
    });
  });
}
