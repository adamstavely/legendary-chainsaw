/* tips-panel: `done` is controllable – a parent can own it, reset it, and a callback alone never freezes it (Phase 3) */
import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/tips-panel";
import * as clean from "@components/tips-panel-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const tips = [
  { id: "a", title: "First", description: "One", action: "Try A" },
  { id: "b", title: "Second", description: "Two", action: "Try B" },
];

for (const [style, ui] of styles) {
  describe(`tips-panel ${style}`, () => {
    test("uncontrolled: starts from defaultDone and reports changes", () => {
      const onDoneChange = vi.fn();
      render(<ui.TipsPanel tips={tips} defaultDone={["a"]} onDoneChange={onDoneChange} />);
      expect(screen.getByText("1/2 done")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Try B" }));
      expect(onDoneChange).toHaveBeenCalledWith(["a", "b"]);
      expect(screen.getByText("2/2 done")).toBeTruthy();
    });

    test("controlled: shows only what the parent says, and a reset brings the actions back", () => {
      const onDoneChange = vi.fn();
      const { rerender } = render(<ui.TipsPanel tips={tips} done={[]} onDoneChange={onDoneChange} />);
      fireEvent.click(screen.getByRole("button", { name: "Try A" }));
      expect(onDoneChange).toHaveBeenCalledWith(["a"]);
      expect(screen.getByRole("button", { name: "Try A" })).toBeTruthy(); // not applied – the parent owns it
      rerender(<ui.TipsPanel tips={tips} done={["a"]} onDoneChange={onDoneChange} />);
      expect(screen.queryByRole("button", { name: "Try A" })).toBeNull();
      rerender(<ui.TipsPanel tips={tips} done={[]} onDoneChange={onDoneChange} />);
      expect(screen.getByRole("button", { name: "Try A" })).toBeTruthy();
    });

    test("a parent holding state works end to end", () => {
      function Parent() {
        const [done, setDone] = useState<string[]>([]);
        return (
          <>
            <output>{done.join(",")}</output>
            <ui.TipsPanel tips={tips} done={done} onDoneChange={setDone} />
          </>
        );
      }
      render(<Parent />);
      fireEvent.click(screen.getByRole("button", { name: "Try B" }));
      expect(screen.queryByRole("button", { name: "Try B" })).toBeNull();
      expect(document.querySelector("output")!.textContent).toBe("b");
    });
    /* WCAG + design pass */
    test("taking an action moves focus onto the tip's Done mark, not <body> (2.4.3)", async () => {
      render(<ui.TipsPanel tips={tips} />);
      const b = screen.getByRole("button", { name: "Try B" });
      b.focus();
      fireEvent.click(b);
      await act(async () => {});
      expect(document.activeElement?.textContent).toBe("Done");
      expect(document.activeElement?.closest("li")?.textContent).toMatch(/Second/);
    });

    test("one persistent status says which tip was done and the count; the counter and Done marks aren't live (4.1.3)", () => {
      const { container } = render(<ui.TipsPanel tips={tips} />);
      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      fireEvent.click(screen.getByRole("button", { name: "Try A" }));
      expect(screen.getAllByRole("status")).toEqual([status]);
      expect(status.textContent).toBe("First: Done. 1 of 2 done.");
      expect(container.querySelector("[aria-live]")).toBeNull();
    });

    test("styles: the primary action is flat ink on the action tokens and buttons use the control tokens", () => {
      render(<ui.TipsPanel tips={tips} />);
      const sheet = [...document.querySelectorAll("style")].map((x) => x.textContent).join("\n");
      expect(sheet).toMatch(/\.ui-tp__btn--primary\s*{[^}]*background: var\(--tc-action-primary-bg/);
      expect(sheet).not.toMatch(/linear-gradient\(light-dark/);
      expect(sheet).toMatch(/\.ui-tp__btn\s*{[^}]*height: var\(--tc-control-h-md/);
    });
  });
}
