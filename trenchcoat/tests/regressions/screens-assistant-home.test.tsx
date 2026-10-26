/* screens/assistant-home: the answer streamed through a React render every 45 ms; the first send's timer and the
   greeting's clock read ran outside effects; Enter sent mid-IME-composition; onSend couldn't be async */
import { Profiler } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AssistantHomeScreen, Composer } from "@screens/assistant-home";

const run = async (ms: number, step = 16) => {
  for (let t = 0; t < ms; t += step) await act(async () => vi.advanceTimersByTime(step));
};

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: false, media: q }) as MediaQueryList);
  Element.prototype.scrollTo = () => {};
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("screens/assistant-home", () => {
  test("the answer streams into the DOM without a React render per word", async () => {
    let commits = 0;
    const { container } = render(
      <Profiler id="ah" onRender={() => commits++}>
        <AssistantHomeScreen />
      </Profiler>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Deep research" }));
    // Greeting fades, the thinking steps run, then the text starts
    const paragraphs = () => [...container.querySelectorAll<HTMLElement>(".ui-as-msg__p")].filter((p) => !p.hidden);
    for (let t = 0; t < 10_000 && paragraphs().length === 0; t += 50) await run(50, 50);
    expect(paragraphs().length).toBeGreaterThan(0);
    const before = commits;
    const text = container.querySelector(".ui-as-msg")!.textContent;
    await run(1_000);
    expect(container.querySelector(".ui-as-msg")!.textContent).not.toBe(text);
    // ~22 ticks a second used to mean ~22 renders
    expect(commits - before).toBeLessThanOrEqual(2);
    await run(3_000, 50);
    expect(paragraphs().map((p) => p.textContent)).toContain("Want a short report with sources, ready to share with the team?");
    // The composer can send again once the answer is written
    expect(screen.getByRole("textbox", { name: "Message" })).toBeTruthy();
  });

  test("unmounting while the greeting fades leaves no timers", async () => {
    const { unmount } = render(<AssistantHomeScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Create table" }));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("Enter during IME composition doesn't send", () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    const field = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(field, { target: { value: "にほん" } });
    fireEvent.keyDown(field, { key: "Enter", isComposing: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(field, { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("にほん");
  });

  test("a rejected onSend puts the message back with the error; sending waits meanwhile", async () => {
    let reject!: (e: Error) => void;
    const onSend = vi.fn(() => new Promise((_, r) => (reject = r)));
    render(<Composer onSend={onSend} />);
    const field = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Message" });
    fireEvent.change(field, { target: { value: "Hello" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(field.value).toBe("");
    fireEvent.change(field, { target: { value: "Again" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(onSend).toHaveBeenCalledTimes(1);
    fireEvent.change(field, { target: { value: "" } });
    await act(async () => reject(new Error("Network error")));
    expect(field.value).toBe("Hello");
    expect(screen.getByRole("alert").textContent).toBe("Network error");
  });

  test("no reach into other components' classes and no zoom (WCAG + design pass, s1)", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("screens/assistant-home.tsx", "utf8");
    expect(css).not.toMatch(/zoom\s*:/);
    expect(css).not.toMatch(/\.ui-(pl|df|ap|tc|um|kpi|think|dt|sg|fm|button)\b/);
  });

  test("Send is aria-disabled (still focusable) while there is nothing to send", () => {
    render(<Composer />);
    const send = screen.getByRole<HTMLButtonElement>("button", { name: "Send" });
    expect(send.disabled).toBe(false);
    expect(send.getAttribute("aria-disabled")).toBe("true");
  });

  test("starting from a suggestion chip moves focus to the composer, not to <body>", async () => {
    const { container } = render(<AssistantHomeScreen />);
    const chip = screen.getByRole("button", { name: "Create table" });
    chip.focus();
    fireEvent.click(chip);
    await run(400);
    expect(screen.queryByRole("button", { name: "Create table" })).toBeNull();
    expect(document.activeElement).toBe(container.querySelector(".ui-as-composer__field"));
  });
});
