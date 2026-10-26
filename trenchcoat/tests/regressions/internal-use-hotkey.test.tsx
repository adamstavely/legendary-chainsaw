/* useHotkey (src/internal): one window listener per combination across instances and published files; the newest
 * instance wins, a handler returning false passes the key on, and `false` registers nothing. */
import { render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useHotkey } from "../../src/internal/use-hotkey";

function Probe({ combo, run }: { combo: string | false; run: () => boolean | void }) {
  useHotkey(combo, run);
  return null;
}

const press = (init: KeyboardEventInit) => {
  const e = new KeyboardEvent("keydown", { cancelable: true, ...init });
  window.dispatchEvent(e);
  return e;
};

afterEach(() => vi.restoreAllMocks());

describe("useHotkey", () => {
  test("one listener for several instances; the newest wins and false passes the key on", () => {
    const add = vi.spyOn(window, "addEventListener");
    const older = vi.fn();
    const newer = vi.fn(() => false);
    const { unmount } = render(
      <>
        <Probe combo="mod+k" run={older} />
        <Probe combo="Mod + K" run={newer} />
      </>,
    );
    expect(add.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
    const e = press({ key: "k", ctrlKey: true });
    expect(newer).toHaveBeenCalledTimes(1);
    expect(older).toHaveBeenCalledTimes(1);
    expect(e.defaultPrevented).toBe(true);
    unmount();
    expect(press({ key: "k", ctrlKey: true }).defaultPrevented).toBe(false);
  });

  test("false registers nothing and never prevents the default", () => {
    const run = vi.fn();
    render(<Probe combo={false} run={run} />);
    expect(press({ key: "k", metaKey: true }).defaultPrevented).toBe(false);
    expect(run).not.toHaveBeenCalled();
  });

  test("modifiers must match, keys match by key or code, IME composition is ignored", () => {
    const run = vi.fn();
    render(<Probe combo="F8" run={run} />);
    press({ key: "F8", ctrlKey: true });
    press({ key: "F8", isComposing: true });
    expect(run).not.toHaveBeenCalled();
    press({ key: "Unidentified", code: "F8" });
    expect(run).toHaveBeenCalledTimes(1);
  });
});
