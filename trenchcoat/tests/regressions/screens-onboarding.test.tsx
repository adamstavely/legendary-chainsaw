/* screens/onboarding: Phase 5 review – hard-coded ids, onComplete promises, props copied into state, controllable step */
import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { OnboardingScreen } from "@screens/onboarding";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const kicker = () => document.querySelector(".ui-ob-kicker")?.textContent;

describe("onboarding screen", () => {
  test("two screens on a page don't share label ids", () => {
    render(
      <>
        <OnboardingScreen defaultStep={1} />
        <OnboardingScreen defaultStep={1} />
      </>,
    );
    const groups = [...document.querySelectorAll("[aria-labelledby]")].filter((el) => el.closest(".ui-ob-field"));
    const ids = groups.map((el) => el.getAttribute("aria-labelledby")!);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(document.getElementById(id)?.textContent).toMatch(/How many people/);
  });

  test("a rejected onComplete keeps the last step open with the error, and a retry finishes", async () => {
    const onComplete = vi.fn().mockRejectedValueOnce(new Error("Agent quota reached")).mockResolvedValueOnce(undefined);
    render(<OnboardingScreen defaultStep={4} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "Create agent" }));
    await act(async () => vi.advanceTimersByTime(1100));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert").textContent).toBe("Agent quota reached");
    expect(kicker()).toBe("Step 4 of 4");

    fireEvent.click(screen.getByRole("button", { name: "Create agent" }));
    // The alert region stays mounted (so the next error is announced) and is emptied
    expect(screen.getByRole("alert").textContent).toBe("");
    await act(async () => vi.advanceTimersByTime(1100));
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(kicker()).toBe("All set");
  });

  test("a pending onComplete shows “Creating agent” until it settles", async () => {
    let resolve!: () => void;
    const onComplete = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<OnboardingScreen defaultStep={4} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(screen.getByRole("button", { name: /Creating agent/ })).toBeTruthy();
    await act(async () => resolve());
    expect(kicker()).toBe("All set");
  });

  test("a promise that settles after unmount sets nothing", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    let reject!: (e: Error) => void;
    const view = render(<OnboardingScreen defaultStep={4} onComplete={() => new Promise((_, r) => (reject = r))} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    view.unmount();
    await act(async () => reject(new Error("late")));
    expect(error).not.toHaveBeenCalled();
  });

  test("the workspace name follows the prop until it's edited", () => {
    const { rerender } = render(<OnboardingScreen defaultStep={1} workspace="Acme" />);
    rerender(<OnboardingScreen defaultStep={1} workspace="Globex" />);
    expect(screen.getByDisplayValue("Globex")).toBeTruthy();
    expect(screen.getByDisplayValue("globex")).toBeTruthy();
    fireEvent.change(screen.getByDisplayValue("Globex"), { target: { value: "Initech" } });
    rerender(<OnboardingScreen defaultStep={1} workspace="Umbrella" />);
    expect(screen.getByDisplayValue("Initech")).toBeTruthy();
  });

  test("step: controlled stays put and reports where Continue goes", () => {
    const onStepChange = vi.fn();
    const { rerender } = render(<OnboardingScreen step={2} onStepChange={onStepChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(onStepChange).toHaveBeenCalledWith(3);
    expect(kicker()).toBe("Step 2 of 4");
    rerender(<OnboardingScreen step={1} onStepChange={onStepChange} />);
    expect(kicker()).toBe("Step 1 of 4");
    expect(document.querySelector(".ui-ob-step")?.getAttribute("data-dir")).toBe("back");
  });
});

/* WCAG + design pass: the template radiogroup's keyboard pattern, focus after removals and step changes, live error */
describe("onboarding screen – keyboard, focus and announcements", () => {
  const flush = () => act(async () => {});

  test("templates: one tab stop, arrow keys move the choice and focus", () => {
    render(<OnboardingScreen defaultStep={4} />);
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: "ArrowRight" });
    expect(radios[1].getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(radios[1]);
    fireEvent.keyDown(radios[1], { key: "ArrowLeft" });
    fireEvent.keyDown(radios[0], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(radios[2]);
    fireEvent.keyDown(radios[2], { key: "Home" });
    expect(radios[0].getAttribute("aria-checked")).toBe("true");
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });

  test("removing an invite hands focus to the next one, the last to the field", async () => {
    render(<OnboardingScreen defaultStep={3} />);
    const field = screen.getByRole("textbox", { name: "Email addresses" });
    fireEvent.change(field, { target: { value: "sam@acme.com" } });
    fireEvent.keyDown(field, { key: "Enter" });
    const first = screen.getByRole("button", { name: "Remove jamie@acme.com" });
    first.focus();
    fireEvent.click(first);
    await flush();
    const next = screen.getByRole("button", { name: "Remove sam@acme.com" });
    expect(document.activeElement).toBe(next);
    fireEvent.click(next);
    await flush();
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Email addresses" }));
  });

  test("Back on the second step goes away – focus moves to the new step's heading", async () => {
    render(<OnboardingScreen defaultStep={2} />);
    const back = screen.getByRole("button", { name: "Back" });
    back.focus();
    fireEvent.click(back);
    await flush();
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Set up your workspace" }));
  });

  test("the error region is there from the start, and a missing name is described on the field", () => {
    render(<OnboardingScreen defaultStep={1} />);
    expect(screen.getByRole("alert").textContent).toBe("");
    const name = screen.getByRole("textbox", { name: "Workspace name" });
    fireEvent.change(name, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    const hint = document.getElementById(name.getAttribute("aria-describedby")!);
    expect(hint?.textContent).toMatch(/Give your workspace a name/);
  });

  test("the screen styles don't reach into the Button's internal classes", () => {
    render(<OnboardingScreen />);
    const css = readFileSync("screens/onboarding.tsx", "utf8").split("const css =")[1];
    expect(css).not.toMatch(/\.ui-button/);
  });
});
