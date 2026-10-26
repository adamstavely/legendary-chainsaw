/*
 * illustrations/glass-folder: screens render it with label="" to keep it out of the accessibility tree, which gave
 * role="img" with an empty name instead; no className/DOM props/ref on the root.
 */
import { createRef } from "react";
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { GlassFolder } from "@illustrations/glass-folder";

describe("illustrations/glass-folder", () => {
  test("decorative by default and with label=\"\", an image when labelled", () => {
    const { container, rerender } = render(<GlassFolder label="" />);
    const root = () => container.querySelector<HTMLElement>(".ui-fd")!;
    expect(root().getAttribute("aria-hidden")).toBe("true");
    expect(root().getAttribute("role")).toBeNull();
    rerender(<GlassFolder />);
    expect(root().getAttribute("aria-hidden")).toBe("true");
    rerender(<GlassFolder label="Project files" />);
    expect(root().getAttribute("role")).toBe("img");
    expect(root().getAttribute("aria-label")).toBe("Project files");
  });

  test("className, DOM props and ref reach the root", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<GlassFolder ref={ref} className="mine" data-x="1" />);
    const root = container.querySelector<HTMLElement>(".ui-fd")!;
    expect(ref.current).toBe(root);
    expect(root.className).toBe("ui-fd mine");
    expect(root.dataset.x).toBe("1");
  });
});
