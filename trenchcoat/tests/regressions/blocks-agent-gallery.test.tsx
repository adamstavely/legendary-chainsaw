/*
 * blocks/agent-gallery (WCAG + design pass): picking a side panel removed the focused button, so focus fell to
 * <body> (2.4.3); the caption's live region was re-mounted on every change (keyed), so it was not a persistent
 * region (4.1.3); the arrows were hand-rolled buttons – now library Buttons.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AgentGallery } from "@blocks/agent-gallery";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "setTimeout", "clearTimeout"] });
});
afterEach(() => vi.useRealTimers());

describe("blocks/agent-gallery", () => {
  test("picking a side panel moves focus into the panel that opens, not to <body>", async () => {
    const { container } = render(<AgentGallery />);
    const pick = screen.getAllByRole("button", { name: "Show Onboarding coach" }).find((b) => !b.closest('[aria-hidden="true"]'))!;
    pick.focus();
    fireEvent.click(pick);
    expect(pick.isConnected).toBe(false);
    const screenEl = container.querySelector(".ui-ag__panel[data-open] .ui-ag__screen")!;
    expect(document.activeElement).toBe(screenEl);
    expect(screenEl.getAttribute("role")).toBe("group");
    expect(screenEl.getAttribute("aria-label")).toBe("Onboarding coach workspace");
  });

  test("after the quiet jump back to the middle copy, focus moves to the same agent's visible button", async () => {
    const { container } = render(<AgentGallery defaultIndex={6} />);
    const visible = (name: string) =>
      [...container.querySelectorAll<HTMLElement>(".ui-ag__pick")].filter((b) => !b.closest('[aria-hidden="true"]') && b.getAttribute("aria-label") === `Show ${name}`);
    // Next from the last agent glides into the third copy, then quietly jumps back to the middle one
    fireEvent.click(screen.getByRole("button", { name: "Next agent" }));
    const [before] = visible("Release notes");
    before.focus();
    await act(async () => vi.advanceTimersByTime(700));
    await act(async () => vi.advanceTimersByTime(50));
    // The button that had focus is now in a hidden copy; focus is on the same agent's button in view
    expect(before.closest('[aria-hidden="true"]')).not.toBeNull();
    const active = document.activeElement as HTMLElement;
    expect(active).not.toBe(before);
    expect(active.getAttribute("aria-label")).toBe("Show Release notes");
    expect(active.closest('[aria-hidden="true"], [inert]')).toBeNull();
  });

  test("the caption is one persistent live region; the arrows are library Buttons", () => {
    const { container } = render(<AgentGallery />);
    const caption = container.querySelector('[aria-live="polite"]')!;
    expect(caption.textContent).toContain("Churn watch");
    const next = screen.getByRole("button", { name: "Next agent" });
    expect(next.classList.contains("ui-button")).toBe(true);
    expect(screen.getByRole("button", { name: "Previous agent" }).classList.contains("ui-button")).toBe(true);
    fireEvent.click(next);
    expect(container.querySelector('[aria-live="polite"]')).toBe(caption);
    expect(caption.textContent).toContain("Onboarding coach");
  });
});
