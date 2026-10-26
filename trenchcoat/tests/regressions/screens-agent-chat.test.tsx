/* screens/agent-chat: "Generate ads" started a timer that set state even after the screen was gone */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AgentChatScreen } from "@screens/agent-chat";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const openBrief = () => {
  // jsdom has no width, so the brief starts closed as on a narrow screen
  fireEvent.click(screen.getByRole("button", { name: "Show brief" }));
};

describe("screens/agent-chat", () => {
  test("generating shows the ads, and keeps the channels switched in the brief", async () => {
    render(<AgentChatScreen />);
    openBrief();
    const facebook = screen.getByRole<HTMLInputElement>("checkbox", { name: /Facebook/ });
    fireEvent.click(facebook);
    fireEvent.click(screen.getByRole("button", { name: "Generate ads" }));
    expect(screen.getByRole("button", { name: "Generating…" })).toBeTruthy();
    await act(async () => vi.advanceTimersByTime(1600));
    expect(screen.getByText("6 ads · Desire-driven")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Brief" }));
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: /Facebook/ }).checked).toBe(true);
  });

  test("unmounting while ads generate clears the timer", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = render(<AgentChatScreen />);
    openBrief();
    fireEvent.click(screen.getByRole("button", { name: "Generate ads" }));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(error).not.toHaveBeenCalled();
  });

  /* WCAG + design pass (s1) */
  test("brief sections are a tablist with arrow keys; the selling angle is a radio group with arrow keys", () => {
    render(<AgentChatScreen />);
    openBrief();
    const list = screen.getByRole("tablist", { name: "Brief sections" });
    const brief = within(list).getByRole("tab", { name: "Brief" });
    brief.focus();
    fireEvent.keyDown(brief, { key: "ArrowRight" });
    expect(document.activeElement).toBe(within(list).getByRole("tab", { name: "Assets", selected: true }));
    fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
    const group = screen.getByRole("radiogroup", { name: "Selling angle" });
    const radios = within(group).getAllByRole("radio");
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1);
    const checked = radios.findIndex((r) => r.getAttribute("aria-checked") === "true");
    radios[checked].focus();
    fireEvent.keyDown(radios[checked], { key: "ArrowDown" });
    const next = within(group).getAllByRole("radio")[(checked + 1) % radios.length];
    expect(next.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(next);
    // The signal strength is text for screen readers, not an aria-label on a span
    expect(next.textContent).toMatch(/Signal \d of 3/);
  });

  test("closing the brief from inside returns focus to the button that opens it", () => {
    render(<AgentChatScreen />);
    openBrief();
    const close = screen.getByRole("button", { name: "Close brief" });
    close.focus();
    fireEvent.click(close);
    expect(screen.queryByRole("complementary", { name: "Brief" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Show brief" }));
  });

  test("Generate keeps focus while it works (aria-disabled, not disabled)", () => {
    render(<AgentChatScreen />);
    openBrief();
    const generate = screen.getByRole("button", { name: "Generate ads" });
    generate.focus();
    fireEvent.click(generate);
    const busy = screen.getByRole("button", { name: "Generating…" });
    expect(busy).toBe(document.activeElement);
    expect((busy as HTMLButtonElement).disabled).toBe(false);
    expect(busy.getAttribute("aria-disabled")).toBe("true");
  });

  test("no reach into other components' classes and no zoom (WCAG + design pass, s1)", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("screens/agent-chat.tsx", "utf8");
    expect(css).not.toMatch(/zoom\s*:/);
    expect(css).not.toMatch(/\.ui-(pl|df|ap|tc|um|kpi|think|dt|sg|fm|button)\b/);
  });
});
