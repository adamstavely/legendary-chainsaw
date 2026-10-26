/* button: WCAG + design pass – loading is announced with the name (4.1.2), the sweep copy is hidden from AT, the
 * primary is flat ink on the action tokens and the geometry comes from the control tokens (design decision 1) */
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import * as standard from "@components/button";
import * as clean from "@components/button-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const css = () => [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");

for (const [style, ui] of styles) {
  describe(`button ${style}`, () => {
    test("loading adds 'loading' to the accessible name once, and the sweep copy is aria-hidden", () => {
      const { rerender } = render(<ui.Button>Save</ui.Button>);
      expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
      rerender(<ui.Button loading>Save</ui.Button>);
      const button = screen.getByRole("button", { name: /^Save\s*, loading$/ });
      expect(button.getAttribute("aria-busy")).toBe("true");
      const shine = button.querySelector(".ui-button__shine");
      expect(shine?.getAttribute("aria-hidden")).toBe("true");
      rerender(<ui.Button>Save</ui.Button>);
      expect(screen.getByRole("button", { name: "Save" }).querySelector(".ui-button__shine, .ui-button__status")).toBeNull();
    });

    test("primary is flat ink and sizes use the control tokens; focus uses the focus outline token", () => {
      render(<ui.Button>Go</ui.Button>);
      const sheet = css();
      expect(sheet).toMatch(/\.ui-button\[data-variant="primary"\]\s*{[^}]*background: var\(--tc-action-primary-bg/);
      expect(sheet).not.toMatch(/linear-gradient\(var\(--tc-button-primary-bg-top/);
      expect(sheet).toMatch(/--tc-button-h: var\(--tc-control-h-md/);
      expect(sheet).toMatch(/--tc-button-h: var\(--tc-control-h-sm/);
      expect(sheet).toMatch(/--tc-button-h: var\(--tc-control-h-lg/);
      expect(sheet).toMatch(/\.ui-button:focus-visible\s*{[^}]*outline: var\(--tc-focus-outline/);
      // the loading sweep is composited: no background-position keyframes
      expect(sheet).not.toMatch(/@keyframes ui-button-sweep\s*{[^@]*background-position/);
    });
  });
}
