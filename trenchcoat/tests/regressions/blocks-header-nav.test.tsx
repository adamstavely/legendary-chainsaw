/* blocks/header-nav in jsdom: the avatar and its account popover, which the block owns. The Lit elements' content
   (names, counts, one popover at a time, the card's actions) is checked in real browsers:
   tests/elements/blocks-header-nav.test.ts. */
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { HeaderNav, headerNavInitials, type HeaderNavPanel, type HeaderNavUser } from "@blocks/header-nav";

const user: HeaderNavUser = { name: "Ada Lovelace", email: "ada@example.com", presence: "online" };
const NOW = Date.UTC(2026, 9, 27, 9, 30);
const notifications = {
  now: NOW,
  items: [
    { id: "n1", actor: "Maya Chen", title: "mentioned you", time: NOW - 60_000 },
    { id: "n2", title: "Deploy finished", time: NOW - 120_000 },
    { id: "n3", title: "Old news", time: NOW - 86_400_000, read: true },
  ],
};
const apps = { apps: [{ id: "mail", name: "Mail", href: "#mail" }, { id: "docs", name: "Docs", href: "#docs" }] };

const avatar = (c: HTMLElement) => c.querySelector<HTMLButtonElement>(".ui-hn__me")!;
const expanded = (b: HTMLElement) => b.getAttribute("aria-expanded");

describe("blocks/header-nav", () => {
  test("the avatar: named, a popup button, with the separator before it and presence as its description", () => {
    const { container } = render(<HeaderNav user={user} notifications={notifications} apps={apps} />);
    const me = avatar(container);
    expect(me.getAttribute("aria-label")).toBe("Account: Ada Lovelace");
    expect(me.getAttribute("aria-haspopup")).toBe("dialog");
    expect(expanded(me)).toBe("false");
    expect(me.previousElementSibling?.classList.contains("ui-hn__sep")).toBe(true);
    expect(container.querySelector(`#${CSS.escape(me.getAttribute("aria-describedby")!)}`)?.textContent).toBe("Online");
    expect(me.querySelector("[data-initials]")?.getAttribute("data-initials")).toBe("AL");
    // Bell, picker, separator, avatar – in that order
    expect([...container.querySelector(".ui-hn")!.children].filter((c) => c.tagName !== "STYLE").map((c) => c.tagName.toLowerCase() + (c.className ? `.${c.className}` : ""))).toEqual([
      "tc-notifications",
      "tc-app-picker",
      "span.ui-hn__sep",
      "button.ui-hn__me",
    ]);
  });

  test("the account popover opens as a dialog, takes focus, and Escape closes it with focus back on the avatar", async () => {
    const { container } = render(<HeaderNav user={user} />);
    avatar(container).focus();
    await act(async () => avatar(container).click());
    const pop = container.querySelector<HTMLElement>(".ui-hn__pop")!;
    expect(pop.getAttribute("role")).toBe("dialog");
    expect(pop.getAttribute("aria-label")).toBe("Account");
    expect(avatar(container).getAttribute("aria-controls")).toBe(pop.id);
    expect(expanded(avatar(container))).toBe("true");
    await waitFor(() => expect(pop.contains(document.activeElement)).toBe(true));

    await act(async () => fireEvent.keyDown(document.activeElement!, { key: "Escape" }));
    expect(container.querySelector(".ui-hn__pop")).toBe(null);
    expect(expanded(avatar(container))).toBe("false");
    expect(document.activeElement).toBe(avatar(container));
  });

  test("a pointer-down outside or focus moving elsewhere closes the card where focus is", async () => {
    const { container } = render(
      <div>
        <button type="button">Elsewhere</button>
        <HeaderNav user={user} />
      </div>,
    );
    const elsewhere = container.querySelector<HTMLButtonElement>("button")!;
    await act(async () => avatar(container).click());
    expect(container.querySelector(".ui-hn__pop")).not.toBe(null);
    await act(async () => fireEvent.pointerDown(document.body));
    expect(container.querySelector(".ui-hn__pop")).toBe(null);

    await act(async () => avatar(container).click());
    await act(async () => elsewhere.focus());
    expect(container.querySelector(".ui-hn__pop")).toBe(null);
    expect(document.activeElement).toBe(elsewhere);
  });

  test("controlled: a click asks the parent, which decides", async () => {
    const onOpenChange = vi.fn();
    const { container, rerender } = render(<HeaderNav user={user} open={null} onOpenChange={onOpenChange} />);
    await act(async () => avatar(container).click());
    expect(onOpenChange).toHaveBeenCalledWith("account");
    expect(container.querySelector(".ui-hn__pop")).toBe(null);
    const panel: HeaderNavPanel = "account";
    rerender(<HeaderNav user={user} open={panel} onOpenChange={onOpenChange} />);
    expect(container.querySelector(".ui-hn__pop")).not.toBe(null);
  });

  test("without notifications or apps, only the avatar shows – no separator", () => {
    const { container } = render(<HeaderNav user={{ name: "Grace Hopper", email: "g@example.com" }} />);
    expect(container.querySelector("tc-notifications, tc-app-picker, .ui-hn__sep")).toBe(null);
    expect(avatar(container).getAttribute("aria-label")).toBe("Account: Grace Hopper");
    expect(avatar(container).hasAttribute("aria-describedby")).toBe(false);
  });

  test("a photo, falling back to initials when it fails to load", () => {
    const { container } = render(<HeaderNav user={{ ...user, avatar: "https://example.com/ada.png" }} />);
    const img = container.querySelector<HTMLImageElement>(".ui-hn__me img")!;
    expect(img.getAttribute("alt")).toBe("");
    fireEvent.error(img);
    expect(container.querySelector(".ui-hn__me img")).toBe(null);
    expect(container.querySelector(".ui-hn__me .ui-hn__face")?.getAttribute("data-initials")).toBe("AL");
    expect(headerNavInitials("  grace  brewster murray hopper ")).toBe("GH");
    expect(headerNavInitials("Cher")).toBe("C");
  });
});
