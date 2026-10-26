/*
 * autonomy-dial: level and pins follow one rule – controlled when the prop is defined, changes always reported;
 * rows are measured in handlers and layout effects, never during render (the old render-phase reads are gone).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/autonomy-dial";
import * as clean from "@components/autonomy-dial-clean";

const actions = [
  { id: "read", label: "Read files", risk: "safe" as const },
  { id: "send", label: "Send email", risk: "risky" as const },
];

for (const [style, ui] of [
  ["standard", standard],
  ["clean", clean],
] as const) {
  describe(`autonomy-dial ${style}`, () => {
    test("controlled level: a click is reported, not applied", () => {
      const onLevelChange = vi.fn();
      const { container } = render(<ui.AutonomyDial actions={actions} level={0} onLevelChange={onLevelChange} />);
      fireEvent.click(screen.getByRole("radio", { name: "Full auto" }));
      expect(onLevelChange).toHaveBeenCalledWith(2);
      expect(container.querySelector(".ui-ad")!.getAttribute("data-level")).toBe("0");
    });

    test("uncontrolled with a callback still moves and reports", () => {
      const onLevelChange = vi.fn();
      const onPinnedChange = vi.fn();
      const { container } = render(<ui.AutonomyDial actions={actions} onLevelChange={onLevelChange} onPinnedChange={onPinnedChange} />);
      fireEvent.click(screen.getByRole("radio", { name: "Full auto" }));
      expect(container.querySelector(".ui-ad")!.getAttribute("data-level")).toBe("2");
      fireEvent.click(screen.getByRole("button", { name: "Always ask before: Send email" }));
      expect(onPinnedChange).toHaveBeenCalledWith(["send"]);
      expect(screen.getByRole("button", { name: "Always ask before: Send email" }).getAttribute("aria-pressed")).toBe("true");
    });

    test("WCAG 2.4.3: the lock keeps focus when its action moves to the other group", async () => {
      render(<ui.AutonomyDial actions={actions} defaultLevel={2} />);
      const lock = screen.getByRole("button", { name: "Always ask before: Read files" });
      act(() => lock.focus());
      await act(async () => fireEvent.click(lock));
      const moved = screen.getByRole("button", { name: "Always ask before: Read files" });
      expect(moved.getAttribute("aria-pressed")).toBe("true");
      expect(moved.closest("section")!.textContent).toMatch(/Asks you first/);
      expect(document.activeElement).toBe(moved);
      await act(async () => fireEvent.click(moved));
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Always ask before: Read files" }));
    });

    test("WCAG 1.4.10 / 1.4.11 / theme: details aren't hidden when narrow, locks stay visible, no .dark colours", () => {
      render(<ui.AutonomyDial actions={[{ ...actions[1], detail: "Gmail · to customers" }]} />);
      expect(screen.getByText("Gmail · to customers").getAttribute("title")).toBe("Gmail · to customers");
      const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("");
      expect(css).not.toMatch(/ui-ad__detail \{ display: none/);
      expect(css).not.toMatch(/ui-ad__pin[^{]*\{[^}]*opacity: 0[;\s]/);
      expect(css).not.toMatch(/\.dark[^{}]*\.ui-ad__/);
    });
  });
}
