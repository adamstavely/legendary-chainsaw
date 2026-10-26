/* useFocusRescue / rescueFocus (src/internal): focus never drops to <body> when the focused control inside a
 * component is removed, disabled or made inert (WCAG 2.4.3). */
import { useRef, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { rescueFocus, useFocusRescue } from "../../src/internal/use-focus-rescue";

function List({ fallbackToNext = false }: { fallbackToNext?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(["a", "b", "c"]);
  const [moved, setMoved] = useState<string[]>([]);
  const [off, setOff] = useState(false);
  const [hidden, setHidden] = useState(false);
  useFocusRescue(root, { fallback: fallbackToNext ? () => root.current?.querySelector("[data-item]") : undefined });
  return (
    <div ref={root} data-testid="root">
      <div inert={hidden || undefined}>
        {items.map((i) => (
          <button key={i} data-item data-focus-key={`remove-${i}`} onClick={() => setItems((all) => all.filter((x) => x !== i))}>
            remove {i}
          </button>
        ))}
        <button data-focus-key="move" onClick={() => setMoved(["x"])} hidden={moved.length > 0}>
          move
        </button>
        <button disabled={off} onClick={() => setOff(true)}>
          disable me
        </button>
        <button onClick={() => setHidden(true)}>hide all</button>
      </div>
      {moved.map((m) => (
        <button key={m} data-focus-key="move">
          moved
        </button>
      ))}
    </div>
  );
}

const click = async (el: HTMLElement) => {
  el.focus();
  await act(async () => fireEvent.click(el));
};

describe("useFocusRescue", () => {
  test("removing the focused control moves focus to the root, not <body>", async () => {
    render(<List />);
    await click(screen.getByText("remove b"));
    expect(document.activeElement).toBe(screen.getByTestId("root"));
    expect(screen.getByTestId("root").getAttribute("tabindex")).toBe("-1");
  });

  test("the fallback is used when given", async () => {
    render(<List fallbackToNext />);
    await click(screen.getByText("remove a"));
    expect(document.activeElement).toBe(screen.getByText("remove b"));
  });

  test("a re-mounted control with the same data-focus-key gets focus back", async () => {
    render(<List />);
    await click(screen.getByText("move"));
    expect(document.activeElement).toBe(screen.getByText("moved"));
  });

  test("disabling or inerting the focused control rescues focus too", async () => {
    render(<List fallbackToNext />);
    await click(screen.getByText("disable me"));
    expect(document.activeElement).toBe(screen.getByText("remove a"));
    await click(screen.getByText("hide all"));
    expect(document.activeElement).toBe(screen.getByTestId("root"));
  });
});

describe("rescueFocus", () => {
  test("moves focus only when it is inside `from`, to the first usable target", () => {
    render(
      <div>
        <div data-testid="from">
          <button>inside</button>
        </div>
        <button disabled>disabled</button>
        <button className="target">target</button>
      </div>,
    );
    const outside = screen.getByText("target");
    outside.focus();
    expect(rescueFocus(screen.getByTestId("from"), [".target"])).toBe(false);
    screen.getByText("inside").focus();
    expect(rescueFocus(screen.getByTestId("from"), [screen.getByText("disabled"), () => null, ".target"])).toBe(true);
    expect(document.activeElement).toBe(outside);
  });
});
