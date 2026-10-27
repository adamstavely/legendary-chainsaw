/*
 * blocks/ai-side-pane: landmark vs dialog, the keyboard-resizable edge, the shortcut, the rail, history, the
 * empty state before the first message and which component shows each answer. Lit wrappers don't receive their
 * properties under jsdom, so these check the block's own markup; the components inside are checked in the browser
 * (the gallery screenshots).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AiSidePane, type SidePaneMessage } from "@blocks/ai-side-pane";

afterEach(() => vi.restoreAllMocks());

const action = (name: string) => document.querySelector(`[data-action="${name}"]`)!;
const separator = () => screen.getByRole("separator", { name: "Resize Assistant" });
const page = { title: "Q3 report", connected: true, count: 4 };

describe("blocks/ai-side-pane", () => {
  test("docked, it's a complementary landmark with a resizable edge that reports its width", () => {
    const onWidthChange = vi.fn();
    render(<AiSidePane defaultWidth={400} onWidthChange={onWidthChange}><p>Page</p></AiSidePane>);
    expect(screen.getByRole("complementary", { name: "Assistant" })).toBeTruthy();
    expect(separator().getAttribute("aria-valuenow")).toBe("400");
    expect(separator().getAttribute("aria-orientation")).toBe("vertical");
    fireEvent.keyDown(separator(), { key: "ArrowLeft" });
    expect(onWidthChange).toHaveBeenLastCalledWith(416);
    fireEvent.keyDown(separator(), { key: "ArrowRight", shiftKey: true });
    expect(onWidthChange).toHaveBeenLastCalledWith(352);
    fireEvent.keyDown(separator(), { key: "Home" });
    expect(onWidthChange).toHaveBeenLastCalledWith(320);
    fireEvent.keyDown(separator(), { key: "End" });
    expect(onWidthChange).toHaveBeenLastCalledWith(640);
  });

  test("a controlled width follows its prop and is clamped", () => {
    const { rerender } = render(<AiSidePane width={500} onWidthChange={() => {}} />);
    expect(separator().getAttribute("aria-valuenow")).toBe("500");
    rerender(<AiSidePane width={9000} onWidthChange={() => {}} />);
    expect(separator().getAttribute("aria-valuenow")).toBe("640");
  });

  test("the shortcut opens it, the close button closes it, and the launcher shows while it's closed", () => {
    const onOpenChange = vi.fn();
    render(<AiSidePane defaultOpen={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole("complementary")).toBeNull();
    const launcher = screen.getByRole("button", { name: /Ask AI/ });
    expect(launcher.getAttribute("aria-keyshortcuts")).toBe("Control+.");
    fireEvent.keyDown(window, { key: ".", code: "Period", ctrlKey: true });
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("complementary", { name: "Assistant" })).toBeTruthy();
    fireEvent.click(action("close"));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  test("a custom shortcut, or none", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<AiSidePane defaultOpen={false} shortcut="alt+k" onOpenChange={onOpenChange} />);
    fireEvent.keyDown(window, { key: ".", ctrlKey: true });
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "˚", code: "KeyK", altKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(true);
    onOpenChange.mockClear();
    rerender(<AiSidePane open={false} shortcut={null} onOpenChange={onOpenChange} />);
    fireEvent.keyDown(window, { key: ".", ctrlKey: true });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  test("it collapses to a rail and expands again", () => {
    const onCollapsedChange = vi.fn();
    render(<AiSidePane onCollapsedChange={onCollapsedChange} />);
    fireEvent.click(action("collapse"));
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    const pane = document.querySelector(".ui-sp__pane")!;
    expect(pane.hasAttribute("data-rail")).toBe(true);
    // The rail is still the landmark; the edge can't be dragged
    expect(screen.getByRole("complementary", { name: "Assistant" })).toBeTruthy();
    expect(screen.queryByRole("separator")).toBeNull();
    fireEvent.click(action("expand"));
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
  });

  test("below the breakpoint it's a modal sheet: the page is inert, Escape and the scrim close it", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 500, height: 600, top: 0, left: 0, right: 500, bottom: 600, x: 0, y: 0, toJSON() {} } as DOMRect);
    const onOpenChange = vi.fn();
    const { container } = render(<AiSidePane onOpenChange={onOpenChange}><button>Page button</button></AiSidePane>);
    const dialog = screen.getByRole("dialog", { name: "Assistant" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(container.querySelector(".ui-sp__page")!.hasAttribute("inert")).toBe(true);
    expect(screen.queryByRole("separator")).toBeNull();
    // No rail as a sheet
    expect(document.querySelector('[data-action="collapse"]')).toBeNull();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(container.querySelector(".ui-sp__page")!.hasAttribute("inert")).toBe(false);
  });

  test("History opens a panel in place of the conversation; Escape and Back close it", () => {
    const conversations = [{ id: "x", title: "Old chat", updatedAt: 0 }];
    const { container } = render(<AiSidePane conversations={conversations} conversation={null} />);
    const history = action("history");
    const panel = container.querySelector<HTMLElement>(".ui-sp__history")!;
    expect(history.getAttribute("aria-expanded")).toBe("false");
    expect(history.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.hidden).toBe(true);
    fireEvent.click(history);
    expect(history.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
    expect(container.querySelector<HTMLElement>(".ui-sp__thread")!.hidden).toBe(true);
    fireEvent.keyDown(panel, { key: "Escape" });
    expect(panel.hidden).toBe(true);
    fireEvent.click(history);
    fireEvent.click(action("back"));
    expect(panel.hidden).toBe(true);
  });

  test("History is left out without conversations", () => {
    render(<AiSidePane />);
    expect(document.querySelector('[data-action="history"]')).toBeNull();
  });

  test("before the first message it shows the starters and says whether the page is connected", () => {
    const starters = [{ id: "s", text: "Summarise the report" }];
    const { container, rerender } = render(<AiSidePane starters={starters} pageContext={page} onPageContextChange={() => {}} />);
    expect(screen.getByText("Ask about Q3 report")).toBeTruthy();
    expect(screen.getByText("The assistant can see this page.")).toBeTruthy();
    expect(container.querySelector(".ui-sp__empty tc-prompt-starters")).toBeTruthy();
    rerender(<AiSidePane starters={starters} pageContext={{ ...page, connected: false }} onPageContextChange={() => {}} />);
    expect(screen.getByText("Ask anything")).toBeTruthy();
    expect(screen.getByText(/Page context is off/)).toBeTruthy();
    rerender(<AiSidePane messages={[{ id: "u", role: "user", text: "Hi" }]} starters={starters} />);
    expect(container.querySelector("tc-prompt-starters")).toBeNull();
  });

  test("answers use ai-answer or claim-answer, each with message-actions; a high-stakes answer gets the reflection gate", () => {
    const messages: SidePaneMessage[] = [
      { id: "u", role: "user", text: "Q", context: "Q3 report" },
      { id: "a", role: "assistant", text: "Revenue rose [1].", sources: [{ title: "Report", name: "Q3" }] },
      { id: "b", role: "assistant", text: "", claims: [{ id: "c", text: "EMEA fell", source: "grounded", confidence: 0.9 }], reflect: "checkpoint" },
      { id: "c", role: "assistant", text: "Hidden until the prior is in", reflect: "prior" },
    ];
    const { container } = render(<AiSidePane messages={messages} />);
    const answers = container.querySelectorAll("article[aria-label='Assistant']");
    expect(answers[0].querySelector("tc-ai-answer")).toBeTruthy();
    // ai-answer's own row is off (hide-actions); message-actions is the one row under every finished answer
    expect(answers[0].querySelectorAll("tc-message-actions")).toHaveLength(1);
    expect(answers[1].querySelector("tc-claim-answer")).toBeTruthy();
    expect(answers[1].querySelector("tc-message-actions")).toBeTruthy();
    // The gate follows the answer – or, in prior mode, comes first and hides it
    expect(answers[1].lastElementChild!.querySelector("tc-reflection-gate")).toBeTruthy();
    expect(answers[2].querySelector("tc-reflection-gate")).toBeTruthy();
    expect(answers[2].querySelector("tc-ai-answer")).toBeNull();
    expect(answers[0].querySelector("tc-reflection-gate")).toBeNull();
    expect(screen.getByText("Q3 report")).toBeTruthy();
  });
});
