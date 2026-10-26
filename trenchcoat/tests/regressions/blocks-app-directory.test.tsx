/*
 * blocks/app-directory: connecting always "succeeded" after a timer whatever the app said, and the timer outlived
 * an unmount; the connected set was copied from the apps once and ignored afterwards.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AppDirectory } from "@blocks/app-directory";

const app = (id: string, name: string) => ({ id, name, vendor: "Acme", description: "", categories: [], logo: null, essential: true });
const apps = [app("slack", "Slack"), app("notion", "Notion")];
// The connect button is named by its visible label plus the app ("Connect Slack", "Connected Slack")
const connect = (name: string) => [...document.querySelectorAll<HTMLElement>(".ui-adir__connect")].find((b) => b.textContent!.includes(name))!;
const state = () => connect("Slack").getAttribute("data-state");

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("blocks/app-directory", () => {
  test("a promise from onToggle keeps the card pending, and a rejection leaves it unconnected with an error", async () => {
    let reject!: (e: Error) => void;
    const onToggle = vi.fn(() => new Promise((_, r) => (reject = r)));
    const onConnectedChange = vi.fn();
    render(<AppDirectory apps={apps} onToggle={onToggle} onConnectedChange={onConnectedChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Connect Slack" }));
    expect(onToggle).toHaveBeenCalledWith(apps[0], true);
    expect(state()).toBe("busy");
    await act(async () => vi.advanceTimersByTime(5000));
    expect(state()).toBe("busy");
    await act(async () => reject(new Error("Slack said no")));
    expect(state()).toBe("off");
    expect(screen.getByRole("alert").textContent).toBe("Slack said no");
    expect(onConnectedChange).not.toHaveBeenCalled();
  });

  test("a resolved promise connects and reports the new list", async () => {
    const onConnectedChange = vi.fn();
    render(<AppDirectory apps={apps} onToggle={() => Promise.resolve()} onConnectedChange={onConnectedChange} />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Connect Slack" })));
    expect(state()).toBe("on");
    expect(onConnectedChange).toHaveBeenCalledWith(["slack"]);
  });

  test("unmounting while connecting leaves no timer behind", () => {
    const view = render(<AppDirectory apps={apps} />);
    fireEvent.click(screen.getByRole("button", { name: "Connect Slack" }));
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("a controlled list follows the prop; a click only reports", () => {
    const onConnectedChange = vi.fn();
    const { rerender } = render(<AppDirectory apps={apps} connected={["slack"]} onConnectedChange={onConnectedChange} />);
    expect(state()).toBe("on");
    fireEvent.click(screen.getByRole("button", { name: "Connected Slack" }));
    expect(onConnectedChange).toHaveBeenCalledWith([]);
    expect(state()).toBe("on");
    rerender(<AppDirectory apps={apps} connected={[]} onConnectedChange={onConnectedChange} />);
    expect(state()).toBe("off");
  });
});

/* WCAG + design pass: the connect button's name starts with its visible label (2.5.3), the filter menu has the menu
   keyboard pattern, focus never drops to <body>, results are announced in one region present from mount */
describe("blocks/app-directory – names, keyboard and focus", () => {
  test("connect buttons are named by their visible label plus the app", () => {
    render(<AppDirectory apps={apps} defaultConnected={["slack"]} />);
    expect(screen.getByRole("button", { name: "Connected Slack" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect Notion" })).toBeTruthy();
    expect(connect("Slack").hasAttribute("aria-label")).toBe(false);
  });

  test("the filter menu takes focus, arrows move, choosing and Esc return focus to the trigger", () => {
    render(<AppDirectory apps={apps} />);
    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    const items = screen.getAllByRole("menuitemradio");
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(items[1], { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Filter" }));
    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Not connected" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Not connected" }));
  });

  test("a card that leaves the filtered list hands focus to the next card's button", () => {
    const onToggle = vi.fn();
    render(<AppDirectory apps={[...apps, app("figma", "Figma")]} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Not connected" }));
    const slack = connect("Slack");
    slack.focus();
    fireEvent.click(slack);
    act(() => vi.advanceTimersByTime(1000));
    expect(document.activeElement).toBe(connect("Notion"));
  });

  test("Clear search focuses the search field; the result is announced", () => {
    const { container } = render(<AppDirectory apps={apps} />);
    const status = container.querySelector(".ui-adir > [role='status']")!;
    expect(status.textContent).toBe("");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });
    const clear = screen.getByRole("button", { name: "Clear search" });
    clear.focus();
    fireEvent.click(clear);
    expect(document.activeElement).toBe(screen.getByRole("searchbox"));
    fireEvent.click(connect("Slack"));
    act(() => vi.advanceTimersByTime(1000));
    expect(status.textContent).toBe("Slack connected");
  });
});
