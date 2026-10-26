/* context-window: a failed onCompact isn't marked compacted – the tray says so and Compact can be pressed again */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/context-window";
import * as clean from "@components/context-window-clean";

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

const parts = [
  { id: "sys", label: "System prompt", tokens: 2000, locked: true },
  { id: "chat", label: "Conversation", tokens: 40000, compact: true },
];

for (const [style, ui] of styles) {
  describe(`context-window ${style}`, () => {
    test("a rejected onCompact leaves the part uncompacted, says so, and can be retried", async () => {
      const onCompact = vi.fn().mockRejectedValueOnce(new Error("quota")).mockResolvedValue(undefined);
      render(<ui.ContextWindow parts={parts} limit={128000} onCompact={onCompact} />);
      fireEvent.click(screen.getByRole("button", { name: "Compact Conversation" }));
      await advance(1500);
      expect(onCompact).toHaveBeenCalledWith("chat", expect.objectContaining({ signal: expect.any(AbortSignal) }));
      const button = screen.getByRole<HTMLButtonElement>("button", { name: "Compact Conversation" });
      expect(button.getAttribute("aria-disabled")).toBeNull();
      expect(screen.getByRole("status").textContent).toMatch(/Couldn't compact Conversation/);

      fireEvent.click(button);
      await advance(1500);
      expect(onCompact).toHaveBeenCalledTimes(2);
      expect(screen.getByRole("button", { name: "Conversation is compacted" })).toBeTruthy();
      expect(screen.queryByText(/Couldn't compact/)).toBeNull();
    });

    test("an onRemoveItem that only listens doesn't freeze removal; new items from the parent show again", async () => {
      const files = (ids: string[]) => [{ id: "files", label: "Files", items: ids.map((id) => ({ id, label: id, tokens: 1000 })) }];
      const onRemoveItem = vi.fn();
      const { rerender } = render(<ui.ContextWindow parts={files(["a.ts", "b.ts"])} limit={128000} onRemoveItem={onRemoveItem} />);
      fireEvent.click(screen.getByRole("button", { name: "Remove a.ts" }));
      await advance(400);
      expect(onRemoveItem).toHaveBeenCalledWith("files", "a.ts");
      expect(screen.queryByRole("button", { name: "Remove a.ts" })).toBeNull();
      // Same items again (a re-render that didn't handle it): still hidden
      rerender(<ui.ContextWindow parts={files(["a.ts", "b.ts"])} limit={128000} onRemoveItem={onRemoveItem} />);
      expect(screen.queryByRole("button", { name: "Remove a.ts" })).toBeNull();
      // The parent's list changed: it is the source of truth again
      rerender(<ui.ContextWindow parts={files(["a.ts", "b.ts", "c.ts"])} limit={128000} onRemoveItem={onRemoveItem} />);
      expect(screen.getByRole("button", { name: "Remove a.ts" })).toBeTruthy();
    });

    test("a compaction shrinks the part until the parent passes its own size", async () => {
      const onCompact = vi.fn().mockResolvedValue(undefined);
      const chat = (tokens: number) => [{ id: "chat", label: "Conversation", tokens, compact: 0.5 }];
      const { container, rerender } = render(<ui.ContextWindow parts={chat(40000)} limit={128000} onCompact={onCompact} />);
      fireEvent.click(screen.getByRole("button", { name: "Compact Conversation" }));
      await advance(2500);
      expect(container.querySelector(".ui-cw__sr")!.textContent).toMatch(/^20\.0K of/);
      rerender(<ui.ContextWindow parts={chat(12000)} limit={128000} onCompact={onCompact} />);
      await advance(100);
      expect(container.querySelector(".ui-cw__sr")!.textContent).toMatch(/^12\.0K of/);
    });

    test("a compaction running when the card unmounts is aborted", async () => {
      let signal: AbortSignal | undefined;
      const onCompact = vi.fn((_id: string, o: { signal: AbortSignal }) => {
        signal = o.signal;
        return new Promise<void>(() => {});
      });
      const { unmount } = render(<ui.ContextWindow parts={parts} limit={128000} onCompact={onCompact} />);
      fireEvent.click(screen.getByRole("button", { name: "Compact Conversation" }));
      await advance(100);
      expect(signal?.aborted).toBe(false);
      unmount();
      expect(signal?.aborted).toBe(true);
    });
  });
}

/* WCAG pass: Compact is no longer nested in the part's button (4.1.2), the status region announces results – not
   the hover caption (4.1.3), focus stays put on Compact and moves on when it or a removed item goes (2.4.3) */
const mixed = [
  { id: "files", label: "Files", items: ["a.ts", "b.ts"].map((id) => ({ id, label: id, tokens: 1000 })), compact: true },
  { id: "chat", label: "Conversation", tokens: 40000, compact: true },
];
for (const [style, ui] of styles) {
  describe(`context-window ${style} – a11y`, () => {
    test("no button inside a button; the part's button is named by its label", () => {
      const { container } = render(<ui.ContextWindow parts={mixed} limit={128000} />);
      expect(container.querySelector("button button")).toBeNull();
      const toggle = screen.getByRole("button", { name: "Files" });
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(toggle.contains(screen.getByRole("button", { name: "Compact Files" }))).toBe(false);
    });

    test("a status region is there from mount; the hover caption is not live", () => {
      const { container } = render(<ui.ContextWindow parts={mixed} limit={128000} />);
      expect(container.querySelector("[aria-live]")).toBeNull();
      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      fireEvent.pointerEnter(container.querySelector(".ui-cw__part")!, { pointerType: "mouse" });
      expect(container.querySelector(".ui-cw__caption")!.textContent).toMatch(/Files/);
      expect(status.textContent).toBe("");
    });

    test("Compact keeps focus while it works; when it folds away focus moves on, not to <body>", async () => {
      const onCompact = vi.fn().mockResolvedValue(undefined);
      render(<ui.ContextWindow parts={parts} limit={128000} onCompact={onCompact} action={{ label: "New chat", onClick: () => {} }} />);
      const button = screen.getByRole("button", { name: "Compact Conversation" });
      button.focus();
      fireEvent.click(button);
      await advance(100);
      expect(button.getAttribute("aria-disabled")).toBe("true");
      expect(document.activeElement).toBe(button);
      expect(screen.getByRole("status").textContent).toMatch(/Compacting Conversation/);
      await advance(1500);
      expect(screen.getByRole("status").textContent).toMatch(/Saved 28K tokens/);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Conversation is compacted" }));
      await advance(2500);
      expect(screen.queryByRole("button", { name: /Conversation is compacted/ })).toBeNull();
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "New chat" }));
    });

    test("removing an item moves focus to the next item's ×, then to the part's button", async () => {
      render(<ui.ContextWindow parts={mixed} limit={128000} />);
      fireEvent.click(screen.getByRole("button", { name: "Files" }));
      const first = screen.getByRole("button", { name: "Remove a.ts" });
      first.focus();
      fireEvent.click(first);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove b.ts" }));
      expect(first.closest("[inert]")).not.toBeNull();
      expect(screen.getByRole("status").textContent).toBe("Removed a.ts");
      await advance(400);
      const last = screen.getByRole("button", { name: "Remove b.ts" });
      fireEvent.click(last);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Files" }));
    });
  });
}

test("context-window: parts that step back keep readable text – no opacity on the row", () => {
  render(<standard.ContextWindow parts={parts} limit={128000} />);
  const css = document.querySelector('style[data-href="ui-context-window"]')!.textContent!;
  expect(css).not.toMatch(/\.ui-cw__part\[data-dim\] \{[^}]*opacity/);
  expect(css).toMatch(/\.ui-cw__part\[data-dim\] :is\(\.ui-cw__label, \.ui-cw__value\) \{ color: var\(--tc-text-muted/);
});
