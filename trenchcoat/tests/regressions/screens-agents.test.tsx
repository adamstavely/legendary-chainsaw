/* screens/agents: the agents that need attention come first, a card opens its agent on the right, New agent opens
   Agent Create, and the cards are one tab stop with arrow keys */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { AgentsScreen } from "@screens/agents";

const cards = (c: HTMLElement) => [...c.querySelectorAll<HTMLButtonElement>(".ui-agnt__card")];

describe("screens/agents", () => {
  test("needs attention first, with why, then the rest of the team", () => {
    const { container } = render(<AgentsScreen defaultSelected={null} />);
    const first = screen.getByRole("region", { name: "Needs attention" });
    expect(within(first).getByText(/request form changed/)).toBeTruthy();
    expect(cards(container)[0].textContent).toMatch(/Interlibrary loans/);
    expect(screen.getByRole("region", { name: "The rest of the team" })).toBeTruthy();
  });

  test("the filter tabs narrow the cards", () => {
    const { container } = render(<AgentsScreen defaultSelected={null} />);
    fireEvent.click(screen.getByRole("tab", { name: "Paused" }));
    expect(cards(container).map((c) => c.dataset.agent)).toEqual(["desk"]);
  });

  test("a card opens its agent on the right; closing goes back to the card", () => {
    const onSelectedChange = vi.fn();
    render(<AgentsScreen defaultSelected={null} onSelectedChange={onSelectedChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Reading lists/ }));
    expect(onSelectedChange).toHaveBeenLastCalledWith("lists");
    const panel = screen.getByRole("complementary", { name: "Reading lists details" });
    expect(within(panel).getByText(/Check each course's reading list/)).toBeTruthy();
    expect(within(panel).getByText("Edition check")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close agent details" }));
    expect(screen.queryByRole("complementary", { name: "Reading lists details" })).toBeNull();
  });

  test("New agent opens Agent Create in the panel", () => {
    const { container } = render(<AgentsScreen defaultSelected={null} />);
    fireEvent.click(screen.getByRole("button", { name: /New agent/ }));
    expect(screen.getByRole("complementary", { name: "New agent" })).toBeTruthy();
    expect(container.querySelector("tc-agent-create")).toBeTruthy();
  });

  test("the cards are one tab stop; arrow keys move between them", () => {
    const { container } = render(<AgentsScreen defaultSelected={null} />);
    const all = cards(container);
    expect(all.filter((c) => c.tabIndex === 0)).toHaveLength(1);
    all[0].focus();
    fireEvent.keyDown(all[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(all[1]);
    fireEvent.keyDown(all[1], { key: "End" });
    expect(document.activeElement).toBe(all[all.length - 1]);
  });

  test("no reach into other components' classes and no zoom", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("screens/agents.tsx", "utf8");
    expect(css).not.toMatch(/zoom\s*:/);
    expect(css).not.toMatch(/\.ui-(asum|acr|button)__/);
  });
});
