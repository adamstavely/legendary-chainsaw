/* gradient-text: the endless flow kept running off screen and in hidden tabs – Phase 5 (motion) */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { GradientText } from "@motion/gradient-text";

let visibility: DocumentVisibilityState = "visible";
afterEach(() => {
  delete (document as { visibilityState?: unknown }).visibilityState;
});

describe("gradient-text", () => {
  test("a hidden tab pauses the flow without a render", async () => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
    const { container } = render(<GradientText sweep={false}>Ship faster</GradientText>);
    const root = container.querySelector<HTMLElement>(".ui-gt")!;
    expect(root.hasAttribute("data-paused")).toBe(false);
    visibility = "hidden";
    await act(async () => void document.dispatchEvent(new Event("visibilitychange")));
    expect(root.hasAttribute("data-paused")).toBe(true);
    visibility = "visible";
    await act(async () => void document.dispatchEvent(new Event("visibilitychange")));
    expect(root.hasAttribute("data-paused")).toBe(false);
  });

  test("the caller's style is kept next to the component's variables", () => {
    const { container } = render(
      <GradientText speed={5} style={{ marginTop: 4 }}>
        Ship
      </GradientText>,
    );
    const root = container.querySelector<HTMLElement>(".ui-gt")!;
    expect(root.style.marginTop).toBe("4px");
    expect(root.style.getPropertyValue("--tc-gradient-text-speed")).toBe("5s");
  });

  test("the flow rests after playFor, on a whole quarter cycle; Infinity loops (2.2.2)", () => {
    const passes = (el: Element) => (el as HTMLElement).style.getPropertyValue("--tc-gradient-text-passes");
    const { container } = render(
      <>
        <GradientText>a</GradientText>
        <GradientText speed={6} playFor={9}>
          b
        </GradientText>
        <GradientText playFor={Infinity}>c</GradientText>
      </>,
    );
    const [a, b, c] = container.querySelectorAll(".ui-gt");
    expect(passes(a)).toBe("0.5"); // 5 s of an 8 s cycle → 2 quarters
    expect(passes(b)).toBe("1.5");
    expect(passes(c)).toBe("infinite");
  });
});
