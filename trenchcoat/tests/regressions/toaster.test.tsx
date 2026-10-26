/* toaster: showing a toast again with the same id while the old one exits reused the exiting item – audit theme 10.
 * Phase 3: the F8 hotkey can be turned off (no listener, no preventDefault), several toasters share one listener,
 * and resetToasts() empties the module store between tests. */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/toaster";
import * as clean from "@components/toaster-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  standard.resetToasts();
  clean.resetToasts();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const advance = async (ms: number, step = 16) => {
  for (let t = 0; t < ms; t += step) {
    await act(async () => {
      vi.advanceTimersByTime(step);
    });
  }
};

for (const [style, ui] of styles) {
  describe(`toaster ${style}`, () => {
    test("re-showing an id within the exit time enters fresh and stays for its duration", async () => {
      const { container } = render(<ui.Toaster />);
      act(() => {
        ui.toast("Saved", { id: "save", duration: 1000 });
      });
      await advance(1100); // its timer ran out – it's exiting now
      act(() => {
        ui.toast("Saved again", { id: "save", duration: 1000 });
      });
      await advance(500);
      const live = [...container.querySelectorAll<HTMLElement>('[data-toast-id="save"]:not([data-removing])')];
      expect(live).toHaveLength(1);
      expect(live[0].textContent).toContain("Saved again");
      expect(live[0].style.opacity).toBe("1");

      act(() => ui.toast.dismiss());
      await advance(600);
      expect(container.querySelectorAll("[data-toast-id]")).toHaveLength(0);
    });

    test("hotkey={false}: F8 is left alone", () => {
      const { container } = render(<ui.Toaster hotkey={false} />);
      act(() => {
        ui.toast("Saved", { duration: Infinity });
      });
      const event = new KeyboardEvent("keydown", { key: "F8", cancelable: true });
      act(() => {
        window.dispatchEvent(event);
      });
      expect(event.defaultPrevented).toBe(false);
      expect(container.contains(document.activeElement)).toBe(false);
      expect(container.querySelector("section")!.getAttribute("aria-label")).toBe("Notifications");
    });

    test("several toasters register one window listener; F8 focuses the stack that has a toast", () => {
      const add = vi.spyOn(window, "addEventListener");
      const { container } = render(
        <>
          <ui.Toaster />
          <ui.Toaster id="side" />
        </>,
      );
      expect(add.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
      act(() => {
        ui.toast("Side note", { toaster: "side", duration: Infinity });
      });
      const event = new KeyboardEvent("keydown", { key: "F8", cancelable: true });
      act(() => {
        window.dispatchEvent(event);
      });
      expect(event.defaultPrevented).toBe(true);
      expect((document.activeElement as HTMLElement).dataset.toastId).toBeTruthy();
      expect(container.querySelectorAll("section")[1].contains(document.activeElement)).toBe(true);
    });

    test("resetToasts empties the store at once", () => {
      const { container } = render(<ui.Toaster />);
      act(() => {
        ui.toast("One");
        ui.toast("Two");
      });
      expect(container.querySelectorAll("[data-toast-id]")).toHaveLength(2);
      act(() => ui.resetToasts());
      expect(container.querySelectorAll("[data-toast-id]")).toHaveLength(0);
    });
  });
}

/* WCAG + design pass: 2.2.1 timing for action toasts, pause on any focus, focus never drops to <body> */

for (const [style, ui] of styles) {
  describe(`toaster ${style} – a11y pass`, () => {
    const alive = (c: HTMLElement) => c.querySelectorAll("[data-toast-id]:not([data-removing])");

    test("a toast with an action stays until it's dismissed (2.2.1); a plain one still times out", async () => {
      const { container } = render(<ui.Toaster />);
      act(() => {
        ui.toast("Archived", { action: { label: "Undo", onClick: () => {} } });
        ui.toast("Saved");
      });
      await advance(5000, 100);
      expect(alive(container)).toHaveLength(1);
      expect(alive(container)[0].textContent).toContain("Archived");
      expect(container.querySelector(".ui-ts__timer")).toBeNull();
    });

    test("actionDuration and a toast's own duration still apply when given", async () => {
      const { container } = render(<ui.Toaster actionDuration={1000} />);
      act(() => {
        ui.toast("Archived", { action: { label: "Undo", onClick: () => {} } });
        ui.toast("Moved", { duration: 2000, action: { label: "Undo", onClick: () => {} } });
      });
      await advance(1200, 100);
      expect([...alive(container)].map((n) => n.textContent)).toEqual([expect.stringContaining("Moved")]);
    });

    test("any focus inside pauses the timer, not only keyboard focus", async () => {
      const { container } = render(<ui.Toaster />);
      act(() => {
        ui.toast("Saved", { duration: 1000 });
      });
      const node = container.querySelector<HTMLElement>("[data-toast-id]")!;
      act(() => node.focus()); // programmatic: no :focus-visible in jsdom
      await advance(2000, 100);
      expect(alive(container)).toHaveLength(1);
      act(() => node.blur());
      await advance(1200, 100);
      expect(alive(container)).toHaveLength(0);
    });

    test("closing the focused toast moves focus to the next toast, then to the region – never <body> (2.4.3)", async () => {
      const { container } = render(<ui.Toaster />);
      act(() => {
        ui.toast("One", { duration: Infinity });
        ui.toast("Two", { duration: Infinity });
      });
      const close = () => container.querySelector<HTMLButtonElement>("[data-toast-id]:not([data-removing]) .ui-ts__close")!;
      act(() => close().focus());
      await act(async () => close().click());
      expect((document.activeElement as HTMLElement).closest("[data-toast-id]")?.textContent).toContain("One");
      await act(async () => close().click());
      expect(document.activeElement).not.toBe(document.body);
      expect(container.querySelector("section")!.contains(document.activeElement)).toBe(true);
    });

    test("the action button moves focus on as well, and both live regions exist from mount", async () => {
      const { container } = render(<ui.Toaster />);
      expect(container.querySelector('[role="status"]')).toBeTruthy();
      expect(container.querySelector('[role="alert"]')).toBeTruthy();
      act(() => {
        ui.toast("Older", { duration: Infinity });
        ui.toast("Archived", { action: { label: "Undo", onClick: () => {} } });
      });
      const undo = container.querySelector<HTMLButtonElement>(".ui-ts__action")!;
      act(() => undo.focus());
      await act(async () => undo.click());
      expect((document.activeElement as HTMLElement).closest("[data-toast-id]")?.textContent).toContain("Older");
    });

    test("the close button is 24px and focus outlines use the focus tokens", () => {
      render(<ui.Toaster />);
      const css = document.querySelector('style[data-href="ui-toaster"]')!.textContent!;
      expect(css).toMatch(/\.ui-ts__close \{[^}]*width: 24px;[^}]*height: 24px;/);
      expect(css).not.toMatch(/[^-]outline: 2px solid var/);
      expect(css).not.toContain("9999");
    });
  });
}
