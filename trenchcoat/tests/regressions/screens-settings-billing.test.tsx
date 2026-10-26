/* screens/settings-billing: Phase 5 review – ids from Date.now() collided, a ref read during render, controllable tab */
import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SettingsBillingScreen } from "@screens/settings-billing";

// A frozen clock: every Date.now() returns the same millisecond
beforeEach(() => vi.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") }));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const invite = (email: string) => {
  fireEvent.click(screen.getByRole("button", { name: "Invite" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Send invite" }));
};

describe("settings & billing screen", () => {
  test("two invites in the same millisecond stay two members", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<SettingsBillingScreen defaultTab="Members" />);
    invite("sam@acme.com");
    invite("kim@acme.com");
    fireEvent.click(screen.getByRole("button", { name: "More for sam" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Revoke invite/ }));
    expect(screen.queryByText("sam@acme.com")).toBeNull();
    expect(screen.getByText("kim@acme.com")).toBeTruthy();
    expect(error.mock.calls.flat().join(" ")).not.toMatch(/same key/);
  });

  test("two keys created in the same millisecond can be revoked one at a time", () => {
    render(<SettingsBillingScreen defaultTab="API keys" />);
    fireEvent.click(screen.getByRole("button", { name: /Create key/ }));
    fireEvent.click(screen.getByRole("button", { name: /Create key/ }));
    fireEvent.click(screen.getByRole("button", { name: "Revoke New key 5 key" }));
    expect(screen.queryByText("New key 5")).toBeNull();
    expect(screen.getByText("New key 4")).toBeTruthy();
  });

  test("general: saving makes the form clean, Discard goes back to the saved values", () => {
    render(<SettingsBillingScreen defaultTab="General" workspace="Acme" />);
    const name = screen.getByDisplayValue("Acme");
    const discard = screen.getByRole("button", { name: "Discard" }) as HTMLButtonElement;
    fireEvent.change(name, { target: { value: "Acme Labs" } });
    expect(discard.disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(discard.disabled).toBe(true);
    fireEvent.change(name, { target: { value: "Other" } });
    fireEvent.click(discard);
    expect(screen.getByDisplayValue("Acme Labs")).toBeTruthy();
  });

  test("tab: controlled stays until the parent changes it, and reports picks", () => {
    const onTabChange = vi.fn();
    const { rerender } = render(<SettingsBillingScreen tab="Billing" onTabChange={onTabChange} />);
    const bar = () => document.querySelector<HTMLElement>(".ui-sb__bar")!;
    fireEvent.click(within(bar()).getByRole("tab", { name: "Members" }));
    expect(onTabChange).toHaveBeenCalledWith("Members");
    expect(within(bar()).getByRole("tab", { selected: true, name: "Billing" })).toBeTruthy();
    rerender(<SettingsBillingScreen tab="Members" onTabChange={onTabChange} />);
    expect(within(bar()).getByRole("tab", { selected: true, name: "Members" })).toBeTruthy();
  });
});

/* WCAG + design pass: focus never drops to <body>; Usage Meter and Button used as they are */
describe("settings & billing screen – focus and composition", () => {
  const flush = () => act(async () => {});

  test("the screen styles don't reach into the Usage Meter's or Button's internal classes", () => {
    render(<SettingsBillingScreen />);
    const css = readFileSync("screens/settings-billing.tsx", "utf8").split("const css =")[1];
    expect(css).not.toMatch(/\.ui-um|\.ui-button/);
  });

  test("revoking a key hands focus to the next key's revoke button", async () => {
    render(<SettingsBillingScreen defaultTab="API keys" />);
    const first = screen.getByRole("button", { name: "Revoke Production key" });
    first.focus();
    fireEvent.click(first);
    await flush();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Revoke Staging key" }));
  });

  test("closing the billing email edit returns focus to Edit", async () => {
    render(<SettingsBillingScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Edit billing email" }));
    const cancel = screen.getByRole("button", { name: "Cancel" });
    cancel.focus();
    fireEvent.click(cancel);
    await flush();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Edit billing email" }));
  });

  test("the plan just picked turns disabled – focus moves to its card", async () => {
    render(<SettingsBillingScreen />);
    const team = screen.getByRole("button", { name: "Switch to Team" });
    team.focus();
    fireEvent.click(team);
    await flush();
    expect(document.activeElement).toBe(screen.getByRole("group", { name: "Team plan" }));
  });

  test("saving the general settings keeps focus in the form", async () => {
    render(<SettingsBillingScreen defaultTab="General" />);
    fireEvent.change(screen.getByDisplayValue("Acme"), { target: { value: "Acme Labs" } });
    const save = screen.getByRole("button", { name: "Save changes" });
    save.focus();
    fireEvent.click(save);
    await flush();
    expect(document.activeElement).toBe(screen.getByRole("form", { name: "Workspace settings" }));
  });

  test("sending an invite returns focus to Invite", async () => {
    render(<SettingsBillingScreen defaultTab="Members" />);
    invite("sam@acme.com");
    await flush();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Invite" }));
  });
});
