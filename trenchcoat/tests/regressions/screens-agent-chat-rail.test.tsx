/* screens/agent-chat-rail: the icon column is one tab stop with arrow keys, the project switcher lists that project's
   chats and opens the first, and what the search found sits in the work area */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { AgentChatRailScreen } from "@screens/agent-chat-rail";

const showChats = () => {
  // jsdom has no width, so the chats column starts closed as on a narrow screen
  const toggle = screen.queryByRole("button", { name: "Show chats" });
  if (toggle) fireEvent.click(toggle);
};

describe("screens/agent-chat-rail", () => {
  test("the icon column is one tab stop; arrow keys move, a click picks", () => {
    const onSectionChange = vi.fn();
    render(<AgentChatRailScreen onSectionChange={onSectionChange} />);
    const bar = screen.getByRole("toolbar", { name: "Sections" });
    const icons = within(bar).getAllByRole("button");
    expect(icons.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    icons[0].focus();
    fireEvent.keyDown(icons[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(icons[1]);
    fireEvent.keyDown(icons[1], { key: "ArrowUp" });
    fireEvent.keyDown(icons[0], { key: "ArrowUp" });
    expect(document.activeElement).toBe(icons[icons.length - 1]);
    fireEvent.click(within(bar).getByRole("button", { name: "Search" }));
    expect(onSectionChange).toHaveBeenCalledWith("search");
  });

  test("switching project lists its chats and opens the first one", () => {
    const onProjectChange = vi.fn();
    const onChatChange = vi.fn();
    const { container } = render(<AgentChatRailScreen onProjectChange={onProjectChange} onChatChange={onChatChange} />);
    showChats();
    expect(container.querySelector(".ui-crail__crumbs b")!.textContent).toBe("Do parks cool their neighbourhood?");
    fireEvent.click(within(screen.getByRole("navigation", { name: "Chats" })).getByRole("button", { name: /Thesis: urban heat/ }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Open access" }));
    expect(onProjectChange).toHaveBeenCalledWith("Open access");
    expect(onChatChange).toHaveBeenCalledWith("c4");
    expect(container.querySelector(".ui-crail__crumbs b")!.textContent).toBe("Open-access funding this year");
  });

  test("the chat shows the question and its answer, and the work area what it found", () => {
    const { container } = render(<AgentChatRailScreen />);
    expect(screen.getByText("How far does a park's cooling effect reach into the streets around it?")).toBeTruthy();
    expect(container.querySelector("tc-ai-answer")).toBeTruthy();
    expect(container.querySelector(".ui-as-panel tc-results-list")).toBeTruthy();
  });

  test("no reach into other components' classes and no zoom", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("screens/agent-chat-rail.tsx", "utf8");
    expect(css).not.toMatch(/zoom\s*:/);
    expect(css).not.toMatch(/\.ui-(ch|aa|cc|rl|button)__/);
  });
});
