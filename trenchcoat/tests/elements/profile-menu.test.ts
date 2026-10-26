/*
 * <tc-profile-menu> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/profile-menu";
import { profileMenuIcon, type ProfileMenuItem, type TcProfileMenu } from "../../src/elements/profile-menu";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const items: ProfileMenuItem[] = [
  { id: "a", label: "Settings", icon: profileMenuIcon("settings") },
  { id: "b", label: "Docs", badge: "New" },
  { id: "c", label: "Log out" },
];
const sheet = () =>
  [...document.adoptedStyleSheets]
    .flatMap((s) => [...s.cssRules].map((r) => r.cssText))
    .concat([...document.querySelectorAll("style")].map((s) => s.textContent ?? ""))
    .join("\n");

describe("tc-profile-menu", () => {
  test("the host is the root; default actions when items is unset", async () => {
    const el = await fixture<TcProfileMenu>(html`<tc-profile-menu name="Ada Lovelace" email="ada@example.com"></tc-profile-menu>`);
    expect(el.dataset.ui).toBe("pm");
    expect(el.dataset.look).toBe("standard");
    expect([...el.querySelectorAll(".ui-pm__label")].map((l) => l.textContent)).toEqual(["Settings", "Docs", "Apps", "Logout"]);
    expect(el.querySelector(".ui-pm__badge")!.textContent).toBe("New");
    expect(el.querySelector(".ui-pm__avatar svg")).toBeTruthy();
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: actions are a named group of buttons, no menu roles, all in the tab order`, async () => {
      const el = await fixture<TcProfileMenu>(html`<tc-profile-menu look=${look} name="Ada" email="ada@example.com" .items=${items}></tc-profile-menu>`);
      expect(el.querySelector('[role="menu"], [role="menuitem"]')).toBeNull();
      const group = el.querySelector('[role="group"][aria-label="Account"]')!;
      const buttons = [...el.querySelectorAll("button")];
      expect(buttons.map((b) => b.textContent!.replace(/\s+/g, ""))).toEqual(["Settings", "DocsNew", "Logout"]);
      for (const b of buttons) {
        expect(group.contains(b)).toBe(true);
        expect(b.tabIndex).toBe(0);
      }
    });

    test(`${look}: arrow keys, Home and End move between the actions`, async () => {
      const el = await fixture<TcProfileMenu>(html`<tc-profile-menu look=${look} name="Ada" email="ada@example.com" .items=${items}></tc-profile-menu>`);
      const [a, b, c] = [...el.querySelectorAll("button")];
      const key = (t: Element, k: string) => t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
      a.focus();
      key(a, "ArrowDown");
      expect(document.activeElement).toBe(b);
      key(b, "End");
      expect(document.activeElement).toBe(c);
      key(c, "ArrowDown");
      expect(document.activeElement).toBe(a);
      key(a, "ArrowUp");
      expect(document.activeElement).toBe(c);
      key(c, "Home");
      expect(document.activeElement).toBe(a);
    });

    test(`${look}: the progressbar has a text value and the next step is a focusable button`, async () => {
      const el = await fixture<TcProfileMenu>(html`<tc-profile-menu look=${look} name="Ada" email="ada@example.com" .items=${items} .setup=${{ done: 3, total: 5, next: "Invite a teammate" }}></tc-profile-menu>`);
      const bar = el.querySelector('[role="progressbar"]')!;
      expect(bar.getAttribute("aria-label")).toBe("Profile setup");
      expect(bar.getAttribute("aria-valuenow")).toBe("60");
      expect(bar.getAttribute("aria-valuetext")).toBe("3 of 5 steps done");
      const next = el.querySelector<HTMLButtonElement>(".ui-pm__next")!;
      expect(next.textContent!.replace(/\s+/g, " ").trim()).toBe("Next: Invite a teammate");
      expect(next.querySelector("[title]")!.getAttribute("title")).toBe("Next: Invite a teammate");
      // Clean: the setup is the card's last row; Standard: it sits in the tray below the card
      expect(!!el.querySelector(".ui-pm__card .ui-pm__setup")).toBe(look === "clean");
    });

    test(`${look}: truncatable name, email and labels carry their full text as a title`, async () => {
      const el = await fixture<TcProfileMenu>(html`<tc-profile-menu look=${look} name="Ada Lovelace" email="ada@example.com" .items=${items}></tc-profile-menu>`);
      expect(el.querySelector(".ui-pm__name")!.getAttribute("title")).toBe("Ada Lovelace");
      expect(el.querySelector(".ui-pm__email")!.getAttribute("title")).toBe("ada@example.com");
      expect(el.querySelector(".ui-pm__label")!.getAttribute("title")).toBe("Settings");
    });
  }

  test("the progress fills once the card is seen", async () => {
    const el = await fixture<TcProfileMenu>(html`<tc-profile-menu name="Ada" email="ada@example.com" .setup=${{ done: 1, total: 3 }}></tc-profile-menu>`);
    await vi.waitFor(() => expect(el.hasAttribute("data-filled")).toBe(true));
  });

  test("focused items and Next show the focus ring, not only a fill", async () => {
    await fixture(html`<tc-profile-menu name="Ada" email="ada@example.com"></tc-profile-menu>`);
    const css = sheet();
    expect(css).toMatch(/\.ui-pm__item:focus-visible,\s*\.ui-pm__next:focus-visible \{\s*outline: var\(--tc-focus-outline/);
    expect(css).not.toMatch(/outline:\s*none/);
  });

  test("picking an action and the next step: events and callbacks", async () => {
    const onSelect = vi.fn();
    const onContinue = vi.fn();
    const seen: string[] = [];
    const el = await fixture<TcProfileMenu>(html`<tc-profile-menu
      name="Ada"
      email="ada@example.com"
      .items=${[{ id: "x", label: "X", onSelect }]}
      .setup=${{ done: 1, total: 3, next: "Verify", onContinue }}
      @tc-item-select=${(e: CustomEvent<{ id: string }>) => seen.push(`item:${e.detail.id}`)}
      @tc-setup-continue=${(e: CustomEvent<{ next: string }>) => seen.push(`next:${e.detail.next}`)}
    ></tc-profile-menu>`);
    el.querySelector<HTMLButtonElement>(".ui-pm__item")!.click();
    el.querySelector<HTMLButtonElement>(".ui-pm__next")!.click();
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onContinue).toHaveBeenCalledOnce();
    expect(seen).toEqual(["item:x", "next:Verify"]);
  });

  test("a custom avatar and item icons are cloned", async () => {
    const avatar = document.createElement("span");
    avatar.className = "mine";
    const el = await fixture<TcProfileMenu>(html`<tc-profile-menu name="Ada" email="ada@example.com" .avatar=${avatar} .items=${items}></tc-profile-menu>`);
    expect(el.querySelector(".ui-pm__avatar .mine")).toBeTruthy();
    expect(avatar.isConnected).toBe(false);
    expect(el.querySelector(".ui-pm__icon svg")).toBeTruthy();
    expect(items[0].icon!.isConnected).toBe(false);
  });

  test("a finished setup has no next button", async () => {
    const el = await fixture<TcProfileMenu>(html`<tc-profile-menu name="Ada" email="ada@example.com" .setup=${{ done: 5, total: 5, next: "x" }}></tc-profile-menu>`);
    expect(el.querySelector(".ui-pm__next")).toBeNull();
    expect(el.querySelector(".ui-pm__setup-count")!.textContent).toBe("5/5");
    el.setup = undefined;
    await settle();
    expect(el.querySelector(".ui-pm__setup")).toBeNull();
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-profile-menu name="Ada" email="ada@example.com" .setup=${{ done: 3, total: 5, next: "Invite a teammate" }}></tc-profile-menu>
      <tc-profile-menu look="clean" name="Ada" email="ada@example.com" .setup=${{ done: 3, total: 5, next: "Invite a teammate" }}></tc-profile-menu>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
