/* blur-crossfade: the swap effect now has dependencies (it ran after every render) – Phase 5 (motion) */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { BlurCrossfade } from "@motion/blur-crossfade";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});
afterEach(() => vi.useRealTimers());

const outgoing = (c: HTMLElement) => c.querySelector(".ui-bx__layer--out")?.textContent;

describe("blur-crossfade", () => {
  test("children updated under the same id are what leaves on the next swap", async () => {
    const view = render(<BlurCrossfade id="a">first</BlurCrossfade>);
    view.rerender(<BlurCrossfade id="a">first, updated</BlurCrossfade>);
    view.rerender(<BlurCrossfade id="b">second</BlurCrossfade>);
    expect(outgoing(view.container)).toBe("first, updated");
    await act(async () => vi.advanceTimersByTime(500));
    expect(outgoing(view.container)).toBeUndefined();
  });

  test("re-rendering the same id doesn't swap", () => {
    const view = render(<BlurCrossfade id="a">one</BlurCrossfade>);
    view.rerender(<BlurCrossfade id="a">one</BlurCrossfade>);
    expect(outgoing(view.container)).toBeUndefined();
    expect(view.container.querySelector(".ui-bx")!.hasAttribute("data-busy")).toBe(false);
  });

  test("DOM props reach the root but the swap key doesn't become its id", () => {
    const { container } = render(
      <BlurCrossfade id="a" title="status" data-x="1">
        one
      </BlurCrossfade>,
    );
    const root = container.querySelector(".ui-bx")!;
    expect(root.getAttribute("title")).toBe("status");
    expect(root.getAttribute("data-x")).toBe("1");
    expect(root.hasAttribute("id")).toBe(false);
  });

  test("focus on a control in the old content moves to the new content's first control, not to <body> (2.4.3)", async () => {
    const view = render(
      <BlurCrossfade id="a">
        <button type="button">Retry</button>
      </BlurCrossfade>,
    );
    view.getByRole("button", { name: "Retry" }).focus();
    view.rerender(
      <BlurCrossfade id="b">
        <p>Done</p>
        <button type="button">Undo</button>
      </BlurCrossfade>,
    );
    expect(document.activeElement).toBe(view.getByRole("button", { name: "Undo" }));
  });

  test("with no control in the new content, the new content itself takes focus", () => {
    const view = render(
      <BlurCrossfade id="a">
        <button type="button">Save</button>
      </BlurCrossfade>,
    );
    view.getByRole("button", { name: "Save" }).focus();
    view.rerender(<BlurCrossfade id="b">Saved</BlurCrossfade>);
    const layer = view.container.querySelector<HTMLElement>(".ui-bx__layer:not(.ui-bx__layer--out)")!;
    expect(document.activeElement).toBe(layer);
    expect(layer.getAttribute("tabindex")).toBe("-1");
  });

  test("a swap doesn't take focus when it wasn't inside", () => {
    const outside = document.createElement("button");
    document.body.append(outside);
    outside.focus();
    const view = render(
      <BlurCrossfade id="a">
        <button type="button">One</button>
      </BlurCrossfade>,
    );
    view.rerender(
      <BlurCrossfade id="b">
        <button type="button">Two</button>
      </BlurCrossfade>,
    );
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });
});
