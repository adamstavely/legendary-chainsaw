/* text-reveal: dark-only blur rule (missed data-tc-theme) and a permanent will-change layer on every piece */
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { TextReveal } from "@motion/text-reveal";

const sheet = () => [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");

describe("text-reveal", () => {
  test("screen readers get the sentence once; the moving pieces are hidden", () => {
    const { container } = render(<TextReveal text="Meet your new teammate." />);
    const root = container.querySelector(".ui-trv")!;
    expect(root.querySelector(".ui-trv__sr")!.textContent).toBe("Meet your new teammate.");
    expect(root.querySelector(".ui-trv__p")!.closest("[aria-hidden='true']")).not.toBeNull();
  });

  test("no theme-scoped overrides and no permanent will-change on the pieces", () => {
    render(<TextReveal text="Hi there" />);
    const css = sheet();
    expect(css).not.toMatch(/\[data-theme="dark"\]\) \.ui-trv/);
    expect(css).not.toMatch(/will-change/);
    expect(css).toMatch(/\[data-tc-theme="dark"\]\) \{ color-scheme: dark; \}/);
  });
});
