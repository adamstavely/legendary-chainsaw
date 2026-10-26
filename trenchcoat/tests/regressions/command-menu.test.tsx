/* command-menu: Tab and Shift+Tab leave the field (WCAG 2.1.2) – no section jumping, and the tray no longer offers it */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/command-menu";
import * as clean from "@components/command-menu-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

for (const [style, ui] of styles) {
  describe(`command-menu ${style}`, () => {
    test("Tab and Shift+Tab are left to the browser and don't move the active row", () => {
      render(<ui.CommandMenu />);
      const input = screen.getByRole("combobox");
      const active = input.getAttribute("aria-activedescendant");
      expect(fireEvent.keyDown(input, { key: "Tab" })).toBe(true);
      expect(fireEvent.keyDown(input, { key: "Tab", shiftKey: true })).toBe(true);
      expect(input.getAttribute("aria-activedescendant")).toBe(active);
      expect(screen.queryByText(/jump between sections/)).toBeNull();
    });
  });
}

/* Phase 3 – one API contract: opt-out hotkey with one listener, IME, async runs, unique gradient ids */

for (const [style, ui] of styles) {
  describe(`command-menu ${style} – contract`, () => {
    const press = (init: KeyboardEventInit) => {
      const e = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
      window.dispatchEvent(e);
      return e;
    };

    test("⌘K focuses the field with one window listener for several menus; hotkey={false} leaves it alone", () => {
      const add = vi.spyOn(window, "addEventListener");
      const view = render(
        <>
          <ui.CommandMenu />
          <ui.CommandMenu />
        </>,
      );
      expect(add.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
      add.mockRestore();
      const [, second] = screen.getAllByRole("combobox");
      expect(press({ key: "k", metaKey: true }).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(second);
      view.unmount();

      render(<ui.CommandMenu hotkey={false} />);
      (document.activeElement as HTMLElement | null)?.blur();
      expect(press({ key: "k", ctrlKey: true }).defaultPrevented).toBe(false);
      expect(document.activeElement).not.toBe(screen.getByRole("combobox"));
      expect(screen.queryByText("to open")).toBeNull();
    });

    test("a custom hotkey is shown and used", () => {
      render(<ui.CommandMenu hotkey="ctrl+shift+p" />);
      expect(press({ key: "k", ctrlKey: true }).defaultPrevented).toBe(false);
      expect(press({ key: "P", ctrlKey: true, shiftKey: true }).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(screen.getByRole("combobox"));
    });

    test("Enter while an IME is composing does not run", () => {
      const onRun = vi.fn();
      render(<ui.CommandMenu onRun={onRun} />);
      const input = screen.getByRole("combobox");
      fireEvent.keyDown(input, { key: "Enter", isComposing: true });
      expect(onRun).not.toHaveBeenCalled();
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onRun).toHaveBeenCalledWith("email", undefined, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    });

    test("an async run shows pending, then an error it recovers from, and aborts on unmount", async () => {
      let reject!: () => void;
      let signal!: AbortSignal;
      const onRun = vi
        .fn()
        .mockImplementationOnce(() => new Promise((_, r) => (reject = () => r(new Error("x")))))
        .mockImplementationOnce((_id, _q, o: { signal: AbortSignal }) => ((signal = o.signal), new Promise(() => {})));
      const view = render(<ui.CommandMenu onRun={onRun} />);
      const input = screen.getByRole("combobox");
      fireEvent.keyDown(input, { key: "Enter" });
      expect(view.container.querySelector('[data-state="pending"]')).toBeTruthy();
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onRun).toHaveBeenCalledTimes(1);
      await act(async () => reject());
      expect(screen.getByRole("alert").textContent).toMatch(/Couldn't run/);
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onRun).toHaveBeenCalledTimes(2);
      view.unmount();
      expect(signal.aborted).toBe(true);
    });

    test("the assistant tile's gradient id is unique per instance", () => {
      const view = render(
        <>
          <ui.CommandMenu />
          <ui.CommandMenu />
        </>,
      );
      const ids = [...view.container.querySelectorAll("linearGradient")].map((g) => g.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).not.toContain("ui-cm-spark");
    });
  });
}

/* WCAG + design pass: live regions, focus indicators, long lists, narrow widths */

const cssOf = (container: HTMLElement) => container.ownerDocument.querySelector('style[data-href="ui-command-menu"]')!.textContent!;

for (const [style, ui] of styles) {
  describe(`command-menu ${style} – a11y pass`, () => {
    test("status and alert regions are mounted from the start; the footer is not a live region (4.1.3)", () => {
      const view = render(<ui.CommandMenu />);
      expect(screen.getByRole("status").textContent).toBe("");
      expect(screen.getByRole("alert").textContent).toBe("");
      expect(view.container.querySelector("footer")?.hasAttribute("aria-live")).toBe(false);
      expect(view.container.querySelectorAll("[aria-live]")).toHaveLength(0);
    });

    test("a finished run is announced once in the status region, and a repeat is announced again", () => {
      render(<ui.CommandMenu />);
      const input = screen.getByRole("combobox");
      fireEvent.keyDown(input, { key: "Enter" });
      const first = screen.getByRole("status").textContent;
      expect(first?.trim()).toBe("Ran “Write an email”");
      fireEvent.keyDown(input, { key: "Enter" });
      const second = screen.getByRole("status").textContent;
      expect(second?.trim()).toBe(first?.trim());
      expect(second).not.toBe(first);
    });

    test("the search field has a focus ring on its panel and no bare outline:none (2.4.7)", () => {
      const view = render(<ui.CommandMenu />);
      const css = cssOf(view.container);
      expect(css).toMatch(/\.ui-cm__card:has\(input:focus-visible\)\s*\{\s*outline: var\(--tc-focus-outline/);
      expect(css).not.toMatch(/input:focus-visible\s*\{\s*outline:\s*none/);
    });

    test("the active row gets a ≥3:1 edge while the field has focus, and stays lit in Clean (1.4.11)", () => {
      const view = render(<ui.CommandMenu />);
      expect(cssOf(view.container)).toMatch(/\.ui-cm:has\(input:focus\) \.ui-cm__pill \{ opacity: 1; box-shadow: inset 0 0 0 1px var\(--tc-border-selected/);
    });

    test("hints stay visible at narrow widths – only keyboard chips are hidden (1.4.10)", () => {
      const view = render(<ui.CommandMenu />);
      const narrow = cssOf(view.container).split("@container (max-width: 480px)")[1]?.split("@media")[0] ?? "";
      expect(narrow).not.toContain("ui-cm__hint");
    });

    test("very long lists render at most maxRows rows and say so", () => {
      const groups = [{ id: "all", label: "All", commands: Array.from({ length: 500 }, (_, i) => ({ id: `c${i}`, label: `Command ${i}` })) }];
      const view = render(<ui.CommandMenu groups={groups} maxRows={50} />);
      expect(view.container.querySelectorAll('[role="option"]')).toHaveLength(50);
      expect(screen.getByText(/Showing 50 of 500/)).toBeTruthy();
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "Command 49" } });
      expect(screen.queryByText(/Showing/)).toBeNull();
    });
  });
}
