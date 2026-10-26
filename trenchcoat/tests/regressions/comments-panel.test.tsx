/*
 * H7 comments-panel: Undo after "Edit applied" used to reset only the panel while onRunEdit had already run,
 * edits without onRunEdit were reported as applied after a timer, and failed edits were swallowed.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/comments-panel";
import * as clean from "@components/comments-panel-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const advance = async (ms: number, step = 100) => {
  for (let t = 0; t < ms; t += step) {
    await act(async () => {
      vi.advanceTimersByTime(step);
    });
  }
};

const warnings = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([m]) => String(m).startsWith("CommentsPanel:"));

const comments = [{ id: "e1", author: { name: "Mia Chen" }, createdAt: 0, text: "/edit tighten the intro" }];
const you = { name: "You" };
const runEdit = () => screen.getByRole("button", { name: /Run edit/ });

for (const [style, ui] of styles) {
  const { CommentsPanel } = ui;

  describe(`comments-panel (${style})`, () => {
    // Runs first: the warning is once per page, so a later test would find it already spent
    test("simulated edits: silent with demo, otherwise one warning", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { unmount } = render(<CommentsPanel comments={comments} currentUser={you} demo />);
      fireEvent.click(runEdit());
      await advance(1200);
      expect(warnings(warn)).toHaveLength(0);
      // Nothing reached a consumer, so the simulated edit may be undone
      expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
      unmount();

      render(
        <>
          <CommentsPanel comments={comments} currentUser={you} />
          <CommentsPanel comments={comments} currentUser={you} />
        </>,
      );
      for (const b of screen.getAllByRole("button", { name: /Run edit/ })) fireEvent.click(b);
      await advance(1200);
      expect(warnings(warn)).toHaveLength(1);
    });

    test("an edit applied through onRunEdit offers no Undo without onUndoEdit", async () => {
      render(<CommentsPanel comments={comments} currentUser={you} onRunEdit={vi.fn(() => Promise.resolve())} />);
      fireEvent.click(runEdit());
      await advance(200);
      expect(screen.getByText("Edit applied")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    });

    test("Undo calls onUndoEdit with the comment and reopens the edit", async () => {
      const onUndoEdit = vi.fn(() => Promise.resolve());
      render(<CommentsPanel comments={comments} currentUser={you} onRunEdit={() => Promise.resolve()} onUndoEdit={onUndoEdit} />);
      fireEvent.click(runEdit());
      await advance(200);
      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
      await advance(200);
      expect(onUndoEdit).toHaveBeenCalledWith(comments[0]);
      expect(runEdit()).toBeTruthy();
    });

    test("a rejected onUndoEdit keeps the edit applied and says so", async () => {
      render(
        <CommentsPanel comments={comments} currentUser={you} onRunEdit={() => Promise.resolve()} onUndoEdit={() => Promise.reject(new Error("x"))} />,
      );
      fireEvent.click(runEdit());
      await advance(200);
      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
      await advance(200);
      expect(screen.getByText("Edit applied")).toBeTruthy();
      expect(screen.getByRole("alert").textContent).toMatch(/couldn't be undone/);
    });

    test("a rejected onRunEdit shows an error and the edit can run again", async () => {
      const onRunEdit = vi.fn<() => Promise<void>>().mockRejectedValueOnce(new Error("conflict")).mockResolvedValue();
      render(<CommentsPanel comments={comments} currentUser={you} onRunEdit={onRunEdit} />);
      fireEvent.click(runEdit());
      await advance(200);
      expect(screen.queryByText("Edit applied")).toBeNull();
      expect(screen.getByRole("alert").textContent).toMatch(/couldn't be applied/);
      expect((runEdit() as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(runEdit());
      await advance(200);
      expect(screen.getByText("Edit applied")).toBeTruthy();
      expect(screen.queryByRole("alert")).toBeNull();
    });

    /* Phase 3: `comments` stays the source of truth; onAdd may be async; resolved and filter are controllable */

    const texts = () => [...document.querySelectorAll(".ui-cp__text")].map((p) => p.textContent);
    const write = (text: string) => {
      fireEvent.change(screen.getByRole("textbox", { name: "Add a comment" }), { target: { value: text } });
      fireEvent.click(screen.getByRole("button", { name: "Send comment" }));
    };
    const question = { id: "q1", author: { name: "Ann" }, createdAt: 1000, text: "Is this final?" };

    test("later comments from the parent show", () => {
      const { rerender } = render(<CommentsPanel comments={[question]} currentUser={you} demo />);
      rerender(<CommentsPanel comments={[question, { ...question, id: "q2", createdAt: 2000, text: "And this?" }]} currentUser={you} demo />);
      expect(texts()).toEqual(["And this?", "Is this final?"]);
    });

    test("an added comment is reported; passed back it isn't doubled", () => {
      const onCommentsChange = vi.fn();
      const { rerender } = render(<CommentsPanel comments={[question]} currentUser={you} demo onCommentsChange={onCommentsChange} />);
      write("Yes, final.");
      const next = onCommentsChange.mock.calls[0][0];
      expect(next.map((c: { text: string }) => c.text)).toEqual(["Yes, final.", "Is this final?"]);
      rerender(<CommentsPanel comments={next} currentUser={you} demo onCommentsChange={onCommentsChange} />);
      expect(texts().filter((t) => t === "Yes, final.")).toHaveLength(1);
    });

    test("a rejected onAdd takes the comment out, gives the text back and says so", async () => {
      let fail!: () => void;
      const onAdd = vi.fn(() => new Promise<void>((_, reject) => (fail = () => reject(new Error("offline")))));
      const onCommentsChange = vi.fn();
      render(<CommentsPanel comments={[question]} currentUser={you} demo onAdd={onAdd} onCommentsChange={onCommentsChange} />);
      write("Yes, final.");
      const pending = document.querySelector(".ui-cp__item[aria-busy]");
      expect(pending?.textContent).toContain("Yes, final.");
      await act(async () => fail());
      expect(texts()).toEqual(["Is this final?"]);
      expect(screen.getByRole("alert").textContent).toMatch(/couldn't be added/);
      expect((screen.getByRole("textbox", { name: "Add a comment" }) as HTMLInputElement).value).toBe("Yes, final.");
      expect(onCommentsChange).toHaveBeenLastCalledWith([question]);
    });

    test("controlled resolved and filter: clicks are reported, not applied", () => {
      const onResolvedChange = vi.fn();
      const onFilterChange = vi.fn();
      render(<CommentsPanel comments={[question]} currentUser={you} demo resolved={[]} onResolvedChange={onResolvedChange} filter="all" onFilterChange={onFilterChange} />);
      fireEvent.click(screen.getByRole("button", { name: "Resolve comment" }));
      expect(onResolvedChange).toHaveBeenCalledWith(["q1"]);
      expect(screen.getByRole("button", { name: "Resolve comment" }).getAttribute("aria-pressed")).toBe("false");
      fireEvent.click(screen.getByRole("button", { name: /Questions/ }));
      expect(onFilterChange).toHaveBeenCalledWith("questions");
      expect(screen.getByRole("button", { name: /^All/ }).getAttribute("aria-pressed")).toBe("true");
    });
  });
}

/*
 * WCAG pass: filters are toggle buttons (no half tab pattern), the sort menu follows the menu-button pattern, Run edit ↔
 * Undo keep focus, the feed isn't one big live region and a persistent status region announces results.
 */
for (const [style, ui] of styles) {
  const { CommentsPanel } = ui;

  describe(`comments-panel a11y (${style})`, () => {
    test("filters are toggle buttons, not tabs without panels", () => {
      render(<CommentsPanel comments={comments} currentUser={you} demo />);
      expect(screen.queryAllByRole("tab")).toHaveLength(0);
      expect(screen.getByRole("group", { name: "Filter comments" })).toBeTruthy();
      const questions = screen.getByRole("button", { name: /^Questions/ });
      fireEvent.click(questions);
      expect(questions.getAttribute("aria-pressed")).toBe("true");
    });

    test("sort menu: focus moves in, arrows move, Esc and picking return focus to the trigger, Tab closes", () => {
      render(<CommentsPanel comments={comments} currentUser={you} demo />);
      const trigger = screen.getByRole("button", { name: "Sort comments" });
      fireEvent.click(trigger);
      const items = screen.getAllByRole("menuitemradio");
      expect(document.activeElement).toBe(items[0]);
      fireEvent.keyDown(items[0], { key: "ArrowDown" });
      expect(document.activeElement).toBe(items[1]);
      fireEvent.keyDown(items[1], { key: "Escape" });
      expect(screen.queryByRole("menu")).toBeNull();
      expect(document.activeElement).toBe(trigger);
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
      fireEvent.click(screen.getByRole("menuitemradio", { name: /Oldest/ }));
      expect(screen.queryByRole("menu")).toBeNull();
      expect(document.activeElement).toBe(trigger);
      fireEvent.click(trigger);
      fireEvent.keyDown(screen.getAllByRole("menuitemradio")[0], { key: "Tab" });
      expect(screen.queryByRole("menu")).toBeNull();
    });

    test("Run edit keeps focus while running, then Undo; Undo hands it back to Run edit", async () => {
      render(<CommentsPanel comments={comments} currentUser={you} demo />);
      const run = runEdit();
      run.focus();
      fireEvent.click(run);
      expect(run.getAttribute("aria-disabled")).toBe("true");
      expect(document.activeElement).toBe(run);
      await advance(1200);
      const undo = screen.getByRole("button", { name: "Undo" });
      expect(document.activeElement).toBe(undo);
      fireEvent.click(undo);
      await advance(100);
      expect(document.activeElement).toBe(runEdit());
    });

    test("the list isn't a live region; a status region present from mount announces results", async () => {
      const { container } = render(<CommentsPanel comments={comments} currentUser={you} demo />);
      expect(container.querySelector("[aria-live]")).toBeNull();
      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      fireEvent.click(runEdit());
      await advance(1200);
      expect(status.textContent).toBe("Edit applied.");
    });

    test("sending with the button hands focus back to the field", () => {
      render(<CommentsPanel comments={comments} currentUser={you} demo />);
      fireEvent.change(screen.getByRole("textbox", { name: "Add a comment" }), { target: { value: "Hi" } });
      const send = screen.getByRole("button", { name: "Send comment" });
      send.focus();
      fireEvent.click(send);
      expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Add a comment" }));
    });
  });
}
