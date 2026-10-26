/* grid-background: the endless drift kept running off screen and in hidden tabs – Phase 5 (motion) */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { GridBackground } from "@motion/grid-background";

let visibility: DocumentVisibilityState = "visible";
afterEach(() => {
  delete (document as { visibilityState?: unknown }).visibilityState;
});

describe("grid-background", () => {
  test("a hidden tab pauses the drift without a render", async () => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
    const { container } = render(<GridBackground>Hero</GridBackground>);
    const root = container.querySelector<HTMLElement>(".ui-gb")!;
    expect(root.hasAttribute("data-paused")).toBe(false);
    visibility = "hidden";
    await act(async () => void document.dispatchEvent(new Event("visibilitychange")));
    expect(root.hasAttribute("data-paused")).toBe(true);
  });

  test("the drift rests after playFor (5 s by default); Infinity loops (2.2.2)", () => {
    const passes = (el: Element) => (el as HTMLElement).style.getPropertyValue("--tc-grid-background-passes");
    const { container } = render(
      <>
        <GridBackground />
        <GridBackground speed={2} playFor={3} />
        <GridBackground playFor={Infinity} />
      </>,
    );
    const [a, b, c] = container.querySelectorAll(".ui-gb");
    expect(passes(a)).toBe(String(5 / 3));
    expect(passes(b)).toBe("1.5");
    expect(passes(c)).toBe("infinite");
  });
});
