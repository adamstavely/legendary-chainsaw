/* integration-picker: Phase 3 contract – `connected` follows props, async toggles, opt-out hotkey, IME, ids */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/integration-picker";
import * as clean from "@components/integration-picker-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

for (const [style, ui] of styles) {
  const { IntegrationPicker, defaultIntegrations } = ui;
  const switchOf = () => screen.getByRole("switch");
  const press = (init: KeyboardEventInit) => {
    const e = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
    window.dispatchEvent(e);
    return e;
  };

  describe(`integration-picker ${style}`, () => {
    test("the integrations' connected flags are followed when a parent changes them", () => {
      const list = defaultIntegrations.map((i) => ({ ...i, connected: false }));
      const view = render(<IntegrationPicker integrations={list} selected="linear" />);
      expect(switchOf().getAttribute("aria-checked")).toBe("false");
      view.rerender(<IntegrationPicker integrations={list.map((i) => (i.id === "linear" ? { ...i, connected: true } : i))} selected="linear" />);
      expect(switchOf().getAttribute("aria-checked")).toBe("true");
    });

    test("controlled connected only reports; onToggle and onConnectedChange both hear it", () => {
      const onToggle = vi.fn();
      const onConnectedChange = vi.fn();
      render(<IntegrationPicker selected="linear" connected={[]} onToggle={onToggle} onConnectedChange={onConnectedChange} />);
      fireEvent.click(switchOf());
      expect(onToggle).toHaveBeenCalledWith("linear", true, expect.objectContaining({ signal: expect.any(AbortSignal) }));
      expect(onConnectedChange).toHaveBeenCalledWith(["linear"]);
      expect(switchOf().getAttribute("aria-checked")).toBe("false");
    });

    test("an async toggle shows pending, flips on success, and says so on failure", async () => {
      let settle!: { resolve: () => void; reject: () => void };
      const onToggle = vi.fn(() => new Promise<void>((resolve, reject) => (settle = { resolve, reject: () => reject(new Error("no")) })));
      const list = defaultIntegrations.map((i) => ({ ...i, connected: false }));
      render(<IntegrationPicker integrations={list} selected="linear" onToggle={onToggle} />);
      fireEvent.click(switchOf());
      expect(switchOf().getAttribute("aria-busy")).toBe("true");
      expect(switchOf().getAttribute("aria-checked")).toBe("false");
      await act(async () => settle.reject());
      expect(screen.getByRole("alert").textContent).toMatch(/Couldn't connect Linear/);
      expect(switchOf().getAttribute("aria-checked")).toBe("false");
      fireEvent.click(switchOf());
      await act(async () => settle.resolve());
      expect(switchOf().getAttribute("aria-checked")).toBe("true");
      expect(screen.queryByRole("alert")).toBeNull();
    });

    test("⌘/ uses one window listener for several pickers; hotkey={false} leaves it alone", () => {
      const add = vi.spyOn(window, "addEventListener");
      const view = render(
        <>
          <IntegrationPicker />
          <IntegrationPicker />
        </>,
      );
      expect(add.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
      add.mockRestore();
      expect(press({ key: "/", metaKey: true }).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(screen.getAllByRole("combobox")[1]);
      view.unmount();
      render(<IntegrationPicker hotkey={false} />);
      expect(press({ key: "/", ctrlKey: true }).defaultPrevented).toBe(false);
    });

    test("Enter while an IME is composing doesn't toggle", () => {
      const onToggle = vi.fn();
      render(<IntegrationPicker onToggle={onToggle} />);
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter", isComposing: true });
      expect(onToggle).not.toHaveBeenCalled();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    test("option ids don't contain the integrations' own ids", () => {
      const list = [{ ...defaultIntegrations[0], id: 'odd id"x' }];
      const { container } = render(<IntegrationPicker integrations={list} />);
      const option = container.querySelector('[role="option"]')!;
      expect(option.id).not.toContain("odd");
      expect(screen.getByRole("combobox").getAttribute("aria-activedescendant")).toBe(option.id);
    });

    // WCAG fix pass: stable switch name (4.1.2), narrow status region from mount (4.1.3), details not live
    test("the switch keeps its name; the result is announced by a status region that is there from the start", () => {
      const list = defaultIntegrations.map((i) => ({ ...i, connected: false }));
      const { container } = render(<IntegrationPicker integrations={list} selected="linear" />);
      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      expect(switchOf().getAttribute("aria-label")).toBe("Connect Linear");
      fireEvent.click(switchOf());
      expect(switchOf().getAttribute("aria-label")).toBe("Connect Linear");
      expect(switchOf().getAttribute("aria-checked")).toBe("true");
      expect(screen.getByRole("status")).toBe(status);
      expect(status.textContent).toBe("Linear connected");
      expect(container.querySelector(".ui-ip__detail")!.closest("[aria-live]")).toBeNull();
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
      expect(status.textContent).toBe("Linear disconnected");
    });
  });
}
