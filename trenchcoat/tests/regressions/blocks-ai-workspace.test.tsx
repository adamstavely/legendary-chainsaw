/*
 * blocks/ai-workspace: a rejected `respond` left the chat "Thinking…" forever (and raised an unhandled rejection);
 * the streamed answer re-rendered the whole workspace every 40 ms; the dialog had a fixed id; conversations and
 * projects were copied into state once and ignored afterwards.
 */
import { Profiler } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AiWorkspace } from "@blocks/ai-workspace";

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: false, media: q }) as MediaQueryList);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const starter = () => screen.getByRole("button", { name: "Compare our pricing tiers" });

describe("blocks/ai-workspace", () => {
  test("a rejected answer shows an error with Try again, which recovers", async () => {
    const respond = vi.fn().mockRejectedValueOnce(new Error("Model is busy")).mockResolvedValueOnce("Keep three tiers.");
    render(<AiWorkspace respond={respond} />);
    await act(async () => fireEvent.click(starter()));
    expect(screen.queryByText("Thinking…")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("Model is busy");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Try again" })));
    await act(async () => vi.advanceTimersByTime(2000));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(document.querySelector(".ui-aw__msg--ai .ui-aw__ai-body p")?.textContent).toBe("Keep three tiers.");
    expect(respond).toHaveBeenLastCalledWith("Compare our pricing tiers", expect.any(Array));
  });

  test("the answer types itself in without re-rendering the workspace per step", async () => {
    const answer = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
    let commits = 0;
    const { container } = render(
      <Profiler id="aw" onRender={() => commits++}>
        <AiWorkspace respond={async () => answer} />
      </Profiler>,
    );
    await act(async () => fireEvent.click(starter()));
    const before = commits;
    await act(async () => vi.advanceTimersByTime(120));
    const typing = container.querySelector(".ui-aw__msg--ai .ui-aw__ai-body p")!.textContent!;
    expect(typing.length).toBeGreaterThan(0);
    expect(typing.length).toBeLessThan(answer.length);
    // One frame at a time – act() would batch a coarser step into one commit
    for (let t = 0; t < 2000; t += 16) await act(async () => vi.advanceTimersByTime(16));
    expect(container.querySelector(".ui-aw__msg--ai .ui-aw__ai-body p")!.textContent).toBe(answer);
    // ~40 typing steps; only the start and the end of the stream may commit
    expect(commits - before).toBeLessThanOrEqual(3);
  });

  test("two workspaces don't share the dialog's id", () => {
    const { container } = render(
      <>
        <AiWorkspace />
        <AiWorkspace />
      </>,
    );
    const ids = [...container.querySelectorAll('[role="dialog"]')].map((d) => d.getAttribute("aria-labelledby"));
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(container.querySelector(`[id="${id}"]`)?.textContent).toBe("Create project");
  });

  test("controlled conversations follow the prop and changes are reported", async () => {
    const onConversationsChange = vi.fn();
    const one = [{ id: "a", title: "Alpha", messages: [] }];
    const { rerender } = render(<AiWorkspace conversations={one} onConversationsChange={onConversationsChange} respond={async () => "Hi"} />);
    await act(async () => fireEvent.click(starter()));
    expect(onConversationsChange).toHaveBeenCalled();
    expect(onConversationsChange.mock.calls[0][0]).toHaveLength(2);
    rerender(<AiWorkspace conversations={[{ id: "b", title: "Beta", messages: [] }]} onConversationsChange={onConversationsChange} />);
    expect(screen.getByText("Beta")).toBeTruthy();
    expect(screen.queryByText("Alpha")).toBeNull();
  });
});

/* WCAG + design pass: menus have the menu keyboard pattern, focus never drops to <body>, one narrow status region */
describe("blocks/ai-workspace – keyboard and focus", () => {
  test("a menu takes focus, arrows move, choosing returns focus to its trigger", () => {
    render(<AiWorkspace />);
    const trigger = screen.getByRole("button", { name: /Brand Refresh/ });
    fireEvent.click(trigger);
    const items = screen.getAllByRole("menuitemradio");
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(items[1], { key: "End" });
    expect(document.activeElement).toBe(items[items.length - 1]);
    fireEvent.click(items[1]);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Customer Research/ }));
  });

  test("Esc closes a menu and focus goes back to the trigger", () => {
    render(<AiWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Share chat" }));
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "More" }));
  });

  test("collapsing and opening the sidebar keeps focus on the toggle's counterpart", () => {
    // jsdom has no layout, so the workspace counts as narrow and starts with the sidebar closed
    render(<AiWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Collapse sidebar" }));
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Open sidebar" }));
  });

  test("the dialog takes focus, keeps Tab inside and returns focus to Create project", () => {
    render(<AiWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    const create = screen.getByRole("button", { name: "Create project" });
    create.focus();
    fireEvent.click(create);
    const field = screen.getByRole("textbox", { name: "Project name" });
    expect(document.activeElement).toBe(field);
    const cancel = screen.getByRole("button", { name: "Cancel" });
    fireEvent.keyDown(field, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(cancel);
    fireEvent.keyDown(cancel, { key: "Tab" });
    expect(document.activeElement).toBe(field);
    fireEvent.click(cancel);
    expect(document.activeElement).toBe(create);
  });

  test("renaming with Enter keeps the name and returns focus to the card's options", () => {
    render(<AiWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    fireEvent.click(screen.getByRole("button", { name: "Pricing Page options" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
    const input = document.querySelector<HTMLInputElement>(".ui-aw__rename")!;
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "Plans" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Plans options" }));
  });

  test("starting a chat from the welcome screen moves focus to the reply box; answers go to one status region", async () => {
    const { container } = render(<AiWorkspace respond={async () => "Keep three tiers."} />);
    const status = container.querySelector(".ui-aw__main > [role='status']")!;
    expect(status.textContent).toBe("");
    starter().focus();
    await act(async () => fireEvent.click(starter()));
    expect(document.activeElement).toBe(container.querySelector(".ui-aw__composer--dock textarea"));
    expect(status.textContent).toBe("Keep three tiers.");
    expect(container.querySelector(".ui-aw__messages")!.hasAttribute("aria-live")).toBe(false);
  });
});
