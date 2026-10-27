/* blocks/header-nav in real browsers: the bell, the app picker and the avatar render in order with their names; only
   one popover is open at a time; each trigger opens with Enter or Space; Escape closes each with focus back on its
   trigger; the account card opens under the avatar, inside the viewport, and its actions report and return focus. */
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { HeaderNav, type HeaderNavPanel, type HeaderNavProps } from "../../blocks/header-nav";
import { LookProvider } from "../../src/elements/react";
import { cleanup, parkPointer, settle } from "./helpers";

const NOW = Date.UTC(2026, 9, 27, 9, 30);
const props: HeaderNavProps = {
  user: { name: "Ada Lovelace", email: "ada@example.com", presence: "online" },
  notifications: {
    now: NOW,
    items: [
      { id: "n1", actor: "Maya Chen", title: "mentioned you in Q3 roadmap", time: NOW - 6 * 60_000, href: "#q3" },
      { id: "n2", title: "Production deploy finished", time: NOW - 2 * 3_600_000 },
      { id: "n3", title: "Weekly digest", time: NOW - 26 * 3_600_000, read: true },
    ],
  },
  apps: {
    current: "mail",
    apps: [
      { id: "mail", name: "Mail", href: "#mail" },
      { id: "calendar", name: "Calendar", href: "#calendar" },
      { id: "docs", name: "Docs", href: "#docs" },
    ],
  },
};

let root: Root | null = null;
async function mount(extra: Partial<HeaderNavProps> = {}, look: "standard" | "clean" = "standard", theme: "light" | "dark" = "light") {
  const host = document.createElement("div");
  host.dataset.tcTheme = theme;
  host.style.cssText = `display: flex; justify-content: flex-end; padding: 12px; width: 100%; box-sizing: border-box; background: ${theme === "dark" ? "#0e0e10" : "#fff"}; color-scheme: ${theme}`;
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(React.createElement(LookProvider, { look }, React.createElement(HeaderNav, { ...props, ...extra }))));
  await act(async () => settle());
  return host;
}
const q = <T extends HTMLElement = HTMLButtonElement>(sel: string) => document.querySelector<T>(sel)!;
const bell = () => q(".ui-ntc__trigger");
const grid = () => q(".ui-apk__trigger");
const avatar = () => q(".ui-hn__me");
const expanded = () => [bell(), grid(), avatar()].map((b) => b.getAttribute("aria-expanded"));
const openPops = () => [...document.querySelectorAll<HTMLElement>(".ui-ntc__pop, .ui-apk__pop, .ui-hn__pop")].filter((p) => p.getClientRects().length);
/** Lets the elements update and the entry animations finish, so boxes and colours are final */
const frames = async () => {
  await act(async () => settle());
  document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
};
const webkit = /AppleWebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = null;
  cleanup();
});

describe("blocks/header-nav", () => {
  test("the three triggers render in order, as one set: the same size and shape, named popup buttons", async () => {
    const host = await mount();
    const buttons = [...host.querySelectorAll<HTMLButtonElement>(".ui-ntc__trigger, .ui-apk__trigger, .ui-hn__me")];
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual(["Notifications, 2 unread", "Apps", "Account: Ada Lovelace"]);
    for (const b of buttons) {
      expect(b.getAttribute("aria-haspopup")).toBe("dialog");
      expect(b.getAttribute("aria-expanded")).toBe("false");
    }
    const boxes = buttons.map((b) => b.getBoundingClientRect());
    expect(new Set(boxes.map((r) => `${r.width}x${r.height}`)).size).toBe(1);
    expect(boxes[0].height).toBe(32);
    expect(new Set(buttons.map((b) => getComputedStyle(b).borderRadius)).size).toBe(1);
    // Left to right, in one row
    expect(boxes[0].right).toBeLessThanOrEqual(boxes[1].left);
    expect(boxes[1].right).toBeLessThan(boxes[2].left);
    expect(new Set(boxes.map((r) => Math.round(r.top))).size).toBe(1);
  });

  test("Clean: the triggers share Clean's control height", async () => {
    const host = await mount({}, "clean");
    const sizes = [...host.querySelectorAll<HTMLButtonElement>(".ui-ntc__trigger, .ui-apk__trigger, .ui-hn__me")].map((b) => b.getBoundingClientRect().height);
    expect(sizes).toEqual([28, 28, 28]);
  });

  test("only one popover is open at a time", async () => {
    const seen: (HeaderNavPanel | null)[] = [];
    await mount({ onOpenChange: (o) => seen.push(o) });
    await userEvent.click(bell());
    await frames();
    expect(expanded()).toEqual(["true", "false", "false"]);
    expect(openPops()).toHaveLength(1);
    await userEvent.click(grid());
    await frames();
    expect(expanded()).toEqual(["false", "true", "false"]);
    expect(openPops().map((p) => p.className)).toEqual(["tc-pop ui-apk__pop"]);
    await userEvent.click(avatar());
    await frames();
    expect(expanded()).toEqual(["false", "false", "true"]);
    expect(openPops().map((p) => p.className)).toEqual(["ui-hn__pop"]);
    await userEvent.click(bell());
    await frames();
    expect(expanded()).toEqual(["true", "false", "false"]);
    expect(openPops()).toHaveLength(1);
    expect(seen.filter(Boolean)).toEqual(["notifications", "apps", "account", "notifications"]);
    await parkPointer();
  });

  test("Enter or Space opens each; Escape closes it and focus returns to that trigger", async () => {
    await mount();
    for (const [trigger, key] of [
      [bell, "{Enter}"],
      [grid, " "],
      [avatar, "{Enter}"],
      [avatar, " "],
    ] as const) {
      trigger().focus();
      await userEvent.keyboard(key);
      await frames();
      expect(trigger().getAttribute("aria-expanded")).toBe("true");
      expect(openPops()).toHaveLength(1);
      // Focus moved into the popover
      expect(openPops()[0].contains(document.activeElement)).toBe(true);
      await userEvent.keyboard("{Escape}");
      await frames();
      expect(openPops()).toHaveLength(0);
      expect(document.activeElement).toBe(trigger());
    }
  });

  // WebKit on macOS skips buttons with Tab by default; the order is checked where the browser tabs to them
  test.skipIf(webkit)("Tab follows the visual order", async () => {
    const host = await mount();
    const before = document.createElement("input");
    host.prepend(before);
    before.focus();
    const order: string[] = [];
    for (let i = 0; i < 3; i++) {
      await userEvent.tab();
      order.push(document.activeElement?.getAttribute("aria-label") ?? "");
    }
    expect(order).toEqual(["Notifications, 2 unread", "Apps", "Account: Ada Lovelace"]);
  });

  test("the account card: under the avatar, aligned to its end, in the viewport; an action reports and returns focus", async () => {
    const picked: string[] = [];
    await mount({ onAccountSelect: (id) => picked.push(id), setup: { done: 2, total: 5, next: "Verify your email" } });
    avatar().focus();
    await userEvent.keyboard("{Enter}");
    await frames();
    const pop = q<HTMLDivElement>(".ui-hn__pop");
    expect(pop.getAttribute("role")).toBe("dialog");
    expect(pop.getAttribute("aria-label")).toBe("Account");
    expect(avatar().getAttribute("aria-controls")).toBe(pop.id);
    if (typeof pop.showPopover === "function") expect(pop.matches(":popover-open")).toBe(true);
    const a = avatar().getBoundingClientRect();
    const p = pop.getBoundingClientRect();
    expect(p.top).toBeGreaterThanOrEqual(a.bottom);
    expect(Math.abs(p.right - a.right)).toBeLessThanOrEqual(1);
    expect(p.left).toBeGreaterThanOrEqual(0);
    expect(pop.textContent).toContain("Ada Lovelace");
    expect(pop.textContent).toContain("ada@example.com");
    expect([...pop.querySelectorAll(".ui-pm__label")].map((l) => l.textContent)).toEqual(["Settings", "Language", "Docs", "Sign out"]);
    expect(document.activeElement?.textContent).toContain("Settings");

    const signOut = [...pop.querySelectorAll<HTMLButtonElement>(".ui-pm__item")].find((b) => b.textContent?.includes("Sign out"))!;
    await userEvent.click(signOut);
    await frames();
    expect(picked).toEqual(["sign-out"]);
    expect(openPops()).toHaveLength(0);
    expect(document.activeElement).toBe(avatar());
    await parkPointer();
  });

  test("a click outside closes the account card without moving focus to the avatar", async () => {
    const host = await mount();
    const outside = document.createElement("button");
    outside.textContent = "Elsewhere";
    host.prepend(outside);
    await userEvent.click(avatar());
    await frames();
    expect(openPops()).toHaveLength(1);
    await userEvent.click(outside);
    await frames();
    expect(openPops()).toHaveLength(0);
    // Where the click put focus (WebKit doesn't focus a clicked button) – never back on the avatar
    expect(document.activeElement).not.toBe(avatar());
    await parkPointer();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations, closed and with the account card open (${theme})`, async () => {
      const host = await mount({}, "standard", theme);
      const run = async () =>
        (await axe.run(document.body, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] })).violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
        );
      expect(await run()).toEqual([]);
      await userEvent.click(avatar());
      await frames();
      expect(host.querySelector(".ui-hn__pop")).not.toBe(null);
      expect(await run()).toEqual([]);
      await parkPointer();
    });
  }
});
