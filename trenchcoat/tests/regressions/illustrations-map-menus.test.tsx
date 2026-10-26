/*
 * region-dach / world-map menus: the listbox panel had outline:none and its active row only showed a faint fill
 * that stayed hidden until an arrow key was pressed, so a keyboard user opening the menu saw no focus at all
 * (WCAG 2.4.7 / 1.4.11). Opened from the keyboard, the active row now shows its fill and a focus ring right away.
 * Also: the menus sit on the menu pattern tokens.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { RegionDach } from "@illustrations/region-dach";
import { WorldMap } from "@illustrations/world-map";

const cases = [
  ["region-dach", "ui-rd", () => <RegionDach />],
  ["world-map", "ui-wm", () => <WorldMap />],
] as const;

describe.each(cases)("%s", (_slug, prefix, element) => {
  test("opened with Enter, the active row shows at once; opened with a click it waits for the pointer", () => {
    const { container } = render(element());
    const trigger = container.querySelector<HTMLButtonElement>(`.${prefix}-trigger`)!;
    const fill = container.querySelector<HTMLElement>(`.${prefix}-fill`)!;
    act(() => {
      fireEvent.click(trigger, { detail: 0 }); // Enter / Space on a button
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(fill.style.opacity).toBe("1");
    const panel = container.querySelector<HTMLElement>('[role="listbox"]')!;
    expect(document.activeElement).toBe(panel);
    fireEvent.keyDown(panel, { key: "Escape" });
    expect(document.activeElement, "Escape returns to the trigger").toBe(trigger);
    act(() => {
      fireEvent.click(trigger, { detail: 1 });
    });
    expect(fill.style.opacity).toBe("0");
  });

  test("the keyboard ring and the menu tokens are in the styles", () => {
    render(element());
    const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");
    expect(css).toContain(`.${prefix}-panel:focus-visible .${prefix}-fill`);
    expect(css).toMatch(/border-radius: var\(--tc-menu-radius/);
    expect(css).toMatch(/border-radius: var\(--tc-menu-item-radius/);
  });
});
