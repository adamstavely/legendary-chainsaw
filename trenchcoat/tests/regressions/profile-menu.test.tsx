/* profile-menu: the consumer's ref and the component's own observer share the root (Phase 3) */
import { createRef } from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/profile-menu";
import * as clean from "@components/profile-menu-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

for (const [style, ui] of styles) {
  describe(`profile-menu ${style}`, () => {
    test("a ref gets the root and the progress still fills when the card is seen", () => {
      let seen: IntersectionObserverCallback | undefined;
      const observed: Element[] = [];
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(cb: IntersectionObserverCallback) {
            seen = cb;
          }
          observe(el: Element) {
            observed.push(el);
          }
          disconnect() {}
        },
      );
      const ref = createRef<HTMLElement>();
      const { container } = render(<ui.ProfileMenu ref={ref} name="Ada" email="ada@example.com" setup={{ done: 1, total: 3 }} />);
      const root = container.querySelector("section")!;
      expect(ref.current).toBe(root);
      expect(observed).toEqual([root]);
      expect(root.hasAttribute("data-filled")).toBe(false);
      act(() => seen!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
      expect(root.hasAttribute("data-filled")).toBe(true);
      vi.unstubAllGlobals();
    });
  });
}

/*
 * WCAG pass: the always-visible action list was role=menu without the menu pattern (S5) → a named group of plain
 * buttons, arrow keys kept as a shortcut; item and "Next" focus was a 1.09:1 fill (2.4.7) → the focus ring; the
 * progressbar says "3 of 5 steps done"; truncated labels carry a title.
 */
for (const [style, ui] of styles) {
  describe(`profile-menu ${style} – a11y`, () => {
    const items = [
      { id: "a", label: "Settings" },
      { id: "b", label: "Docs", badge: "New" },
      { id: "c", label: "Log out" },
    ];

    test("actions are a named group of buttons, no menu roles, all in the tab order", () => {
      const { getByRole, queryByRole, getAllByRole } = render(<ui.ProfileMenu name="Ada" email="ada@example.com" items={items} />);
      expect(queryByRole("menu")).toBeNull();
      expect(queryByRole("menuitem")).toBeNull();
      const group = getByRole("group", { name: "Account" });
      const buttons = getAllByRole("button");
      expect(buttons.map((b) => b.textContent)).toEqual(["Settings", "DocsNew", "Log out"]);
      for (const b of buttons) {
        expect(group.contains(b)).toBe(true);
        expect(b.tabIndex).toBe(0);
      }
    });

    test("arrow keys, Home and End still move between the actions", () => {
      const { getAllByRole } = render(<ui.ProfileMenu name="Ada" email="ada@example.com" items={items} />);
      const [a, b, c] = getAllByRole("button");
      a.focus();
      fireEvent.keyDown(a, { key: "ArrowDown" });
      expect(document.activeElement).toBe(b);
      fireEvent.keyDown(b, { key: "End" });
      expect(document.activeElement).toBe(c);
      fireEvent.keyDown(c, { key: "ArrowDown" });
      expect(document.activeElement).toBe(a);
    });

    test("the progressbar has a text value and the next step is a focusable button", () => {
      const { getByRole } = render(
        <ui.ProfileMenu name="Ada" email="ada@example.com" items={items} setup={{ done: 3, total: 5, next: "Invite a teammate" }} />,
      );
      const bar = getByRole("progressbar", { name: "Profile setup" });
      expect(bar.getAttribute("aria-valuenow")).toBe("60");
      expect(bar.getAttribute("aria-valuetext")).toBe("3 of 5 steps done");
      const next = getByRole("button", { name: /Next: Invite a teammate/ });
      expect(next.querySelector("[title]")?.getAttribute("title")).toBe("Next: Invite a teammate");
    });

    test("truncatable name, email and labels carry their full text as a title", () => {
      const { container } = render(<ui.ProfileMenu name="Ada Lovelace" email="ada@example.com" items={items} />);
      expect(container.querySelector(".ui-pm__name")!.getAttribute("title")).toBe("Ada Lovelace");
      expect(container.querySelector(".ui-pm__email")!.getAttribute("title")).toBe("ada@example.com");
      expect(container.querySelector(".ui-pm__label")!.getAttribute("title")).toBe("Settings");
    });

    test("focused items and Next show the focus ring, not only a fill", () => {
      render(<ui.ProfileMenu name="Ada" email="ada@example.com" items={items} />);
      const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");
      expect(css).toMatch(/\.ui-pm__item:focus-visible,\s*\.ui-pm__next:focus-visible \{\s*outline: var\(--tc-focus-outline/);
      expect(css).not.toMatch(/outline:\s*none/);
    });
  });
}
