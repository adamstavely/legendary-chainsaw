/*
 * permission-request (Phase 3): a timed grant ran out without telling anyone; the countdown seeded Date.now() while
 * rendering; the card measured its height while rendering; Enter during IME composition allowed the request.
 * WCAG pass: Allow/Deny and Revoke/Change dropped focus to <body> (2.4.3); the countdown's "N min left" sat in a
 * role=status and was re-announced every minute (4.1.3); an inline card claimed role=dialog (4.1.2); the scope
 * picker keeps its radiogroup keyboard pattern.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/permission-request";
import * as clean from "@components/permission-request-clean";
import type { PermissionDecision } from "@components/permission-request";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers({ now: 1_000_000 }));
afterEach(() => vi.useRealTimers());

const props = { agent: { name: "Coder" }, action: "push to main", duration: 1 };

for (const [style, ui] of styles) {
  const { PermissionRequest } = ui;
  describe(`permission-request (${style})`, () => {
    test("onExpire fires once when a timed grant runs out on the internal clock, then the clock stops", async () => {
      const onExpire = vi.fn();
      const onDecisionChange = vi.fn();
      const { container } = render(
        <PermissionRequest {...props} defaultScope="timed" onExpire={onExpire} onDecisionChange={onDecisionChange} />,
      );
      fireEvent.click(screen.getByRole("button", { name: /Allow for/ }));
      expect(onDecisionChange).toHaveBeenCalledWith(expect.objectContaining({ allow: true, scope: "timed", at: 1_000_000, until: 1_060_000 }));
      expect(container.querySelector(".ui-pr__result-note")!.textContent).toContain("1 min left");
      // The live region names the outcome, never the countdown
      expect(screen.getByRole("status").textContent).toBe("Allowed for 1 min: Coder may push to main");
      await act(async () => vi.advanceTimersByTime(59_000));
      expect(onExpire).not.toHaveBeenCalled();
      await act(async () => vi.advanceTimersByTime(2_000));
      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(onExpire.mock.calls[0][0]).toMatchObject({ until: 1_060_000 });
      expect(screen.getByRole("status").textContent).toContain("Access expired");
      expect(screen.getByRole("status").textContent).not.toMatch(/min left/);
      expect(vi.getTimerCount()).toBe(0);
      await act(async () => vi.advanceTimersByTime(10_000));
      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    test("onExpire follows a passed-in clock", () => {
      const onExpire = vi.fn();
      const decision: PermissionDecision = { allow: true, scope: "timed", at: 0, until: 60_000 };
      const { rerender } = render(<PermissionRequest {...props} decision={decision} now={30_000} onExpire={onExpire} />);
      expect(onExpire).not.toHaveBeenCalled();
      rerender(<PermissionRequest {...props} decision={decision} now={60_000} onExpire={onExpire} />);
      rerender(<PermissionRequest {...props} decision={decision} now={61_000} onExpire={onExpire} />);
      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    test("a server render of a timed grant doesn't read the clock", () => {
      const spy = vi.spyOn(Date, "now");
      const decision: PermissionDecision = { allow: true, scope: "timed", at: 0, until: 60_000 };
      const { unmount } = render(<PermissionRequest {...props} defaultDecision={decision} />);
      // The only reads come from the effect after mount
      expect(spy.mock.calls.length).toBeLessThanOrEqual(1);
      unmount();
      spy.mockRestore();
    });

    test("controlled decision: the parent decides, the component only reports", () => {
      const onDecisionChange = vi.fn();
      render(<PermissionRequest {...props} decision={null} onDecisionChange={onDecisionChange} />);
      fireEvent.click(screen.getByRole("button", { name: /^Deny/ }));
      expect(onDecisionChange).toHaveBeenCalledWith(expect.objectContaining({ allow: false }));
      expect(screen.getByRole("group", { name: /Coder wants to push to main/ })).toBeTruthy();
    });

    test("Enter while composing (IME) does nothing", () => {
      const onDecisionChange = vi.fn();
      render(<PermissionRequest {...props} onDecisionChange={onDecisionChange} />);
      const card = screen.getByRole("group", { name: /wants to/ });
      fireEvent.keyDown(card, { key: "Enter", isComposing: true });
      expect(onDecisionChange).not.toHaveBeenCalled();
      fireEvent.keyDown(card, { key: "Enter" });
      expect(onDecisionChange).toHaveBeenCalledWith(expect.objectContaining({ allow: true }));
    });

    test("no role=dialog on the inline card; the live region is there from mount and empty while it waits", () => {
      render(<PermissionRequest {...props} />);
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.getByRole("status").textContent).toBe("");
    });

    test("Allow moves focus to the decided line's button, Revoke brings it back to Allow", async () => {
      render(<PermissionRequest {...props} defaultScope="timed" />);
      const allow = screen.getByRole("button", { name: /Allow for/ });
      allow.focus();
      fireEvent.click(allow);
      const revoke = screen.getByRole("button", { name: "Revoke" });
      expect(document.activeElement).toBe(revoke);
      fireEvent.click(revoke);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: /Allow for/ }));
      expect(screen.getByRole("status").textContent).toBe("");
    });

    test("Deny (by Esc from a scope) moves focus to Change, and announces the result once", () => {
      render(<PermissionRequest {...props} />);
      const radio = screen.getByRole("radio", { name: "Just once" });
      radio.focus();
      fireEvent.keyDown(radio, { key: "Escape" });
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Change" }));
      expect(screen.getByRole("status").textContent).toBe("Denied: Coder may not push to main");
    });

    test("when the right runs out, focus stays on the same button (Revoke → Ask again)", async () => {
      render(<PermissionRequest {...props} defaultScope="timed" />);
      fireEvent.click(screen.getByRole("button", { name: /Allow for/ }));
      const button = screen.getByRole("button", { name: "Revoke" });
      button.focus();
      await act(async () => vi.advanceTimersByTime(61_000));
      expect(button.textContent).toBe("Ask again");
      expect(document.activeElement).toBe(button);
    });

    test("a controlling parent that keeps the request: focus returns to Allow, not the card or <body>", async () => {
      render(<PermissionRequest {...props} decision={null} onDecisionChange={() => {}} />);
      const allow = screen.getByRole("button", { name: /^Allow once/ });
      allow.focus();
      fireEvent.click(allow);
      await act(async () => vi.advanceTimersByTime(50));
      expect(document.activeElement).toBe(allow);
    });

    test("a parent swapping in a decision while focus is inside: focus lands on the result's button", async () => {
      const { rerender } = render(<PermissionRequest {...props} decision={null} onDecisionChange={() => {}} />);
      screen.getByRole("radio", { name: "Always" }).focus();
      rerender(<PermissionRequest {...props} decision={{ allow: false, scope: "once", at: 0 }} onDecisionChange={() => {}} />);
      await act(async () => {});
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Change" }));
    });

    test("scopes: radiogroup with arrow keys and roving tabindex", () => {
      render(<PermissionRequest {...props} />);
      const once = screen.getByRole("radio", { name: "Just once" });
      expect(once.tabIndex).toBe(0);
      once.focus();
      fireEvent.keyDown(once, { key: "ArrowRight" });
      const timed = screen.getByRole("radio", { name: "1 min" });
      expect(timed.getAttribute("aria-checked")).toBe("true");
      expect(document.activeElement).toBe(timed);
      expect(once.tabIndex).toBe(-1);
    });
  });
}
