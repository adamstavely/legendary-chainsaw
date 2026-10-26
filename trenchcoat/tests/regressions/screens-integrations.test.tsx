/* screens/integrations: Phase 5 review – a connection's timer outlived the screen; `connected` is controllable */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { IntegrationsScreen } from "@screens/integrations";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("integrations screen", () => {
  test("a connection still going when the screen unmounts leaves no timer", () => {
    const view = render(<IntegrationsScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Connect Notion" }));
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("connected: uncontrolled connects after a moment and reports every id", () => {
    const onConnectedChange = vi.fn();
    render(<IntegrationsScreen defaultConnected={["github"]} onConnectedChange={onConnectedChange} />);
    expect(screen.getByRole("button", { name: "Disconnect GitHub" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Connect Notion" }));
    act(() => vi.advanceTimersByTime(900));
    expect(onConnectedChange).toHaveBeenLastCalledWith(["github", "notion"]);
    expect(screen.getByRole("button", { name: "Disconnect Notion" })).toBeTruthy();
  });

  test("connected: controlled shows the parent's list and only asks for changes", () => {
    const onConnectedChange = vi.fn();
    render(<IntegrationsScreen connected={[]} onConnectedChange={onConnectedChange} />);
    expect(screen.getByRole("button", { name: "Connect Slack" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Connect Slack" }));
    act(() => vi.advanceTimersByTime(900));
    expect(onConnectedChange).toHaveBeenLastCalledWith(["slack"]);
    expect(screen.getByRole("button", { name: "Connect Slack" })).toBeTruthy();
  });
});

/* WCAG + design pass: focus never drops to <body> when a row, the "… and more" button or the request form goes away */
describe("integrations screen – focus and names", () => {
  const flush = () => act(async () => {});

  test("disconnecting under “Connected” hands focus to the row taking its place", async () => {
    render(<IntegrationsScreen defaultConnected={["slack", "notion"]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Connected" }));
    const slack = screen.getByRole("button", { name: "Disconnect Slack" });
    slack.focus();
    fireEvent.click(slack);
    await flush();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Disconnect Notion" }));
  });

  test("the last row leaving hands focus to the search field … or the Request button", async () => {
    render(<IntegrationsScreen defaultConnected={["slack"]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Connected" }));
    const slack = screen.getByRole("button", { name: "Disconnect Slack" });
    slack.focus();
    fireEvent.click(slack);
    await flush();
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement?.closest(".ui-as-integrations")).toBeTruthy();
  });

  test("“… and more” hands focus to the first app it reveals", async () => {
    render(<IntegrationsScreen />);
    const more = screen.getByRole("button", { name: /Stripe, Zapier and 2 more/ });
    more.focus();
    fireEvent.click(more);
    await flush();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Connect Stripe" }));
  });

  test("sending a request returns focus to the Request button", async () => {
    render(<IntegrationsScreen />);
    const request = screen.getByRole("button", { name: "Request" });
    fireEvent.click(request);
    expect(request.getAttribute("aria-expanded")).toBe("true");
    const field = screen.getByRole("textbox", { name: "Tool name" });
    field.focus();
    fireEvent.change(field, { target: { value: "Pipedrive" } });
    fireEvent.submit(field.closest("form")!);
    await flush();
    expect(document.activeElement).toBe(request);
  });

  test("the official badge is announced", () => {
    render(<IntegrationsScreen />);
    expect(screen.getAllByRole("img", { name: "Official" }).length).toBeGreaterThan(0);
  });
});
