/*
 * trace-waterfall (Phase 3): the own clock was seeded with Date.now() while rendering (a hydration mismatch);
 * `now` was run-relative while every other component takes epoch ms; folding/opening ignored "value defined".
 * Phase 4: the own clock writes the live bars and durations into the DOM instead of re-rendering 10× a second.
 */
import { Profiler } from "react";
import { renderToString } from "react-dom/server";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/trace-waterfall";
import * as clean from "@components/trace-waterfall-clean";
import type { TraceSpan } from "@components/trace-waterfall";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers({ now: 1_000_000 }));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const running: TraceSpan = { id: "run", name: "Run", kind: "agent", status: "running", start: 0, children: [{ id: "llm", name: "Plan", kind: "llm", status: "running", start: 0 }] };
// The "now" position lives on the time layer, so a tick doesn't restyle every row (performance pass)
const at = (root: HTMLElement) => (root.querySelector(".ui-tw__layer") as HTMLElement).style.getPropertyValue("--tc-trace-waterfall-at");

for (const [style, ui] of styles) {
  const { TraceWaterfall } = ui;
  describe(`trace-waterfall (${style})`, () => {
    test("a server render with startedAt doesn't read the clock", () => {
      const spy = vi.spyOn(Date, "now");
      const html = renderToString(<TraceWaterfall root={running} startedAt={1_000_000 - 4000} />);
      expect(spy).not.toHaveBeenCalled();
      expect(html).toContain("--tc-trace-waterfall-at:0");
    });

    test("the own clock reads the real time after mount and runs while spans run", async () => {
      const { container } = render(<TraceWaterfall root={running} startedAt={1_000_000 - 4000} />);
      const root = container.querySelector(".ui-tw") as HTMLElement;
      expect(at(root)).toBe("4000");
      await act(async () => vi.advanceTimersByTime(1000));
      expect(at(root)).toBe("5000");
    });

    test("the own clock moves running bars and durations without re-rendering, and pauses when hidden", async () => {
      let commits = 0;
      const { container } = render(
        <Profiler id="tw" onRender={() => commits++}>
          <TraceWaterfall root={running} startedAt={1_000_000 - 2000} />
        </Profiler>,
      );
      const llm = () => screen.getAllByRole("treeitem")[1];
      const bar = () => llm().querySelector("[data-bar]") as HTMLElement;
      await act(async () => vi.advanceTimersByTime(100));
      commits = 0;
      await act(async () => vi.advanceTimersByTime(1500));
      expect(commits).toBe(0);
      expect(bar().style.getPropertyValue("--d")).toBe("3600");
      expect(llm().querySelector(".ui-tw__tag")!.textContent).toBe("3.6s");
      expect(llm().getAttribute("aria-label")).toBeNull();
      expect(llm().textContent).toContain("Plan, LLM call, Running,3.6s");
      expect(container.querySelector(".ui-tw__stat .ui-tw__amount")!.textContent).toBe("3.6s");

      // A hidden tab stops the clock; it catches up when the tab shows again
      const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
      // (the root also marks itself off-screen to pause its animations – a render, so inside act)
      await act(async () => document.dispatchEvent(new Event("visibilitychange")));
      await act(async () => vi.advanceTimersByTime(1000));
      expect(bar().style.getPropertyValue("--d")).toBe("3600");
      visibility.mockReturnValue("visible");
      await act(async () => document.dispatchEvent(new Event("visibilitychange")));
      expect(bar().style.getPropertyValue("--d")).toBe("4600");

      // Past the axis, the range rescales – that is a render
      await act(async () => vi.advanceTimersByTime(5000));
      expect(commits).toBeGreaterThan(0);
      expect(at(container.querySelector(".ui-tw") as HTMLElement)).toBe("9600");
    });

    test("now is epoch ms read against startedAt; elapsed is ms into the run; now alone keeps its old meaning", () => {
      const { container, rerender } = render(<TraceWaterfall root={running} startedAt={500_000} now={503_000} />);
      const root = () => container.querySelector(".ui-tw") as HTMLElement;
      expect(at(root())).toBe("3000");
      rerender(<TraceWaterfall root={running} elapsed={2500} />);
      expect(at(root())).toBe("2500");
      rerender(<TraceWaterfall root={running} now={1200} />);
      expect(at(root())).toBe("1200");
    });

    test("controlled collapsed: a fold is reported, not applied", () => {
      const onCollapsedChange = vi.fn();
      render(<TraceWaterfall root={running} elapsed={1000} collapsed={[]} onCollapsedChange={onCollapsedChange} />);
      const run = screen.getAllByRole("treeitem")[0];
      fireEvent.keyDown(run, { key: "ArrowLeft" });
      expect(onCollapsedChange).toHaveBeenCalledWith(["run"]);
      expect(run.getAttribute("aria-expanded")).toBe("true");
    });

    test("uncontrolled openId reports the span with the id", () => {
      const onOpenChange = vi.fn();
      render(<TraceWaterfall root={running} elapsed={1000} onOpenChange={onOpenChange} />);
      fireEvent.keyDown(screen.getAllByRole("treeitem")[1], { key: "Enter" });
      expect(onOpenChange).toHaveBeenCalledWith("llm", expect.objectContaining({ id: "llm" }));
      expect(screen.getByRole("dialog")).toBeTruthy();
    });
  });
}

/*
 * WCAG + design pass: rows are named by their content (no aria-label that hides the visible text – axe
 * label-content-name-mismatch), with the kind and status spelled out; Enter moves focus into the details (4.1.2,
 * 2.4.3); moving on with the arrows closes them so they never cover the focused row (2.4.11); focus never drops to
 * <body>; long traces render a window of rows (performance audit); the sheen is capped and pauses off-screen (2.2.2).
 */
const done: TraceSpan = {
  id: "run",
  name: "Run",
  kind: "agent",
  status: "done",
  start: 0,
  end: 3000,
  children: [
    { id: "a", name: "Plan", kind: "llm", status: "done", start: 0, end: 1000, detail: "opus" },
    { id: "b", name: "search", kind: "tool", status: "failed", start: 1000, end: 2000 },
    { id: "c", name: "Write", kind: "llm", status: "done", start: 2000, end: 3000 },
  ],
};
const many = (n: number, running = false): TraceSpan => ({
  id: "run",
  name: "Run",
  kind: "agent",
  status: running ? "running" : "done",
  start: 0,
  end: running ? undefined : 9000,
  children: Array.from({ length: n }, (_, i) => ({ id: `s${i}`, name: `span ${i}`, kind: "tool" as const, status: running ? ("running" as const) : ("done" as const), start: i, end: running ? undefined : i + 500 })),
});

for (const [style, ui] of styles) {
  const { TraceWaterfall } = ui;
  describe(`trace-waterfall a11y (${style})`, () => {
    test("rows are named by their visible content plus kind and status, with their place among siblings", () => {
      render(<TraceWaterfall root={done} elapsed={3000} />);
      const rows = screen.getAllByRole("treeitem");
      for (const r of rows) expect(r.hasAttribute("aria-label")).toBe(false);
      expect(rows[1].textContent).toContain("Plan");
      expect(rows[1].textContent).toContain("opus");
      expect(rows[1].textContent).toContain("LLM call, Done");
      expect(rows[2].textContent).toContain("Tool call, Failed");
      expect(rows[2].getAttribute("aria-posinset")).toBe("2");
      expect(rows[2].getAttribute("aria-setsize")).toBe("3");
      // The kind has a non-colour cue too: the swatch shape follows data-kind
      expect(rows[2].getAttribute("data-kind")).toBe("tool");
    });

    test("Enter moves focus into the details; Escape brings it back to the row", () => {
      render(<TraceWaterfall root={done} elapsed={3000} />);
      const row = screen.getAllByRole("treeitem")[1];
      row.focus();
      fireEvent.keyDown(row, { key: "Enter" });
      const dialog = screen.getByRole("dialog");
      expect(document.activeElement).toBe(dialog);
      expect(row.getAttribute("aria-selected")).toBe("true");
      fireEvent.keyDown(dialog, { key: "Escape" });
      expect(document.activeElement).toBe(row);
    });

    test("a click opens the details without taking focus from the row", () => {
      render(<TraceWaterfall root={done} elapsed={3000} />);
      const row = screen.getAllByRole("treeitem")[1];
      row.focus();
      fireEvent.click(row);
      expect(screen.getByRole("dialog")).toBeTruthy();
      expect(document.activeElement).toBe(row);
    });

    test("moving to another row closes the details, so they never cover the focused row", () => {
      const onOpenChange = vi.fn();
      render(<TraceWaterfall root={done} elapsed={3000} defaultOpenId="a" onOpenChange={onOpenChange} />);
      const rows = screen.getAllByRole("treeitem");
      rows[1].focus();
      fireEvent.keyDown(rows[1], { key: "ArrowDown" });
      expect(onOpenChange).toHaveBeenLastCalledWith(null, undefined);
      expect(document.activeElement).toBe(rows[2]);
    });

    test("the close button returns focus to the row; a parent closing the details doesn't drop focus to body", async () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(<TraceWaterfall root={done} elapsed={3000} openId="b" onOpenChange={onOpenChange} />);
      const close = screen.getByRole("button", { name: "Close details" });
      close.focus();
      fireEvent.click(close);
      expect(onOpenChange).toHaveBeenCalledWith(null, undefined);
      expect(document.activeElement).toBe(screen.getAllByRole("treeitem")[2]);
      screen.getByRole("button", { name: "Close details" }).focus();
      rerender(<TraceWaterfall root={done} elapsed={3000} openId={null} />);
      await act(async () => vi.advanceTimersByTime(300));
      expect(document.activeElement).not.toBe(document.body);
      expect(document.activeElement?.getAttribute("role")).toBe("treeitem");
    });

    test("folding the parent of the focused row hands focus to the parent", async () => {
      render(<TraceWaterfall root={done} elapsed={3000} />);
      const rows = screen.getAllByRole("treeitem");
      rows[2].focus();
      fireEvent.keyDown(rows[2], { key: "ArrowLeft" }); // to the parent
      expect(document.activeElement).toBe(rows[0]);
      fireEvent.keyDown(rows[0], { key: "ArrowLeft" }); // fold
      expect(rows[0].getAttribute("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(rows[0]);
    });

    test("a long trace renders a window of rows; the keyboard still reaches every row", () => {
      render(<TraceWaterfall root={many(500)} elapsed={9000} />);
      const tree = screen.getByRole("tree");
      expect(tree.hasAttribute("data-virtual")).toBe(true);
      const rows = () => screen.getAllByRole("treeitem");
      expect(rows().length).toBeLessThan(100);
      rows()[0].focus();
      fireEvent.keyDown(rows()[0], { key: "End" });
      const last = document.activeElement as HTMLElement;
      expect(last.getAttribute("role")).toBe("treeitem");
      expect(last.textContent).toContain("span 499");
      expect(last.getAttribute("aria-posinset")).toBe("500");
      expect(last.getAttribute("tabindex")).toBe("0");
      fireEvent.keyDown(last, { key: "Home" });
      expect((document.activeElement as HTMLElement).textContent).toContain("Run");
    });

    test("short traces render every row", () => {
      render(<TraceWaterfall root={many(50)} elapsed={9000} />);
      expect(screen.getAllByRole("treeitem")).toHaveLength(51);
      expect(screen.getByRole("tree").hasAttribute("data-virtual")).toBe(false);
    });

    test("the sheen runs on at most 20 running bars and the root pauses its animations off-screen", async () => {
      const { container } = render(<TraceWaterfall root={many(40, true)} elapsed={1000} />);
      expect(container.querySelectorAll("[data-bar][data-shine]").length).toBe(20);
      const root = container.querySelector(".ui-tw") as HTMLElement;
      expect(root.hasAttribute("data-offscreen")).toBe(false);
      vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
      await act(async () => document.dispatchEvent(new Event("visibilitychange")));
      expect(root.hasAttribute("data-offscreen")).toBe(true);
    });

    test("the clock position is not set on the root (a tick would restyle every row)", () => {
      const { container } = render(<TraceWaterfall root={running} elapsed={1200} />);
      expect((container.querySelector(".ui-tw") as HTMLElement).style.getPropertyValue("--tc-trace-waterfall-at")).toBe("");
      expect(at(container.querySelector(".ui-tw") as HTMLElement)).toBe("1200");
    });
  });
}
