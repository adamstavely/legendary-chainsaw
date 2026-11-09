/*
 * <tc-header-nav> in real browsers: the page's bell and picker, then the avatar, in that order (also when they're
 * added later); the account card opens as a dialog that takes focus and closes on Escape with focus back on the
 * avatar; one popover at a time; panel changes and account actions are cancelable; initials when the photo fails;
 * the React wrapper (uncontrolled and controlled); axe in both looks and both themes with the card open.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/header-nav";
import "../../src/elements/notifications";
import "../../src/elements/app-picker";
import { headerNavInitials, headerNavTone, type HeaderNavAccountSelect, type HeaderNavPanelChange, type TcHeaderNav } from "../../src/elements/header-nav";
import { HeaderNav } from "../../src/elements/react/header-nav";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 9, 27, 9, 30);
const ITEMS = [
  { id: "n1", actor: "Maya Chen", title: "mentioned you in Q3 roadmap", time: NOW - 6 * 60_000 },
  { id: "n2", title: "Production deploy finished", time: NOW - 2 * 3_600_000, read: true },
];
const APPS = [
  { id: "mail", name: "Mail", href: "#mail" },
  { id: "docs", name: "Docs", href: "#docs" },
];
const USER = { name: "Ada Lovelace", email: "ada@example.com", presence: "online" as const };

const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcHeaderNav>(html`<tc-header-nav look=${look} .user=${USER}>
    <tc-notifications .now=${NOW} .items=${ITEMS}></tc-notifications>
    <tc-app-picker current="mail" .apps=${APPS}></tc-app-picker>
  </tc-header-nav>`);
const avatar = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-hn__me")!;
const bell = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-ntc__trigger")!;
const pop = (el: Element) => el.querySelector<HTMLElement>(".ui-hn__pop");
const tabOrder = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-ntc__trigger, .ui-apk__trigger, .ui-hn__me")].map((b) => b.className.split(" ")[0]);

describe("tc-header-nav", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the bell, the picker, a hairline and the avatar, named with presence as its description`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("hn");
      expect(el.dataset.look).toBe(look);
      expect(tabOrder(el)).toEqual(["ui-ntc__trigger", "ui-apk__trigger", "ui-hn__me"]);
      expect(el.querySelector(".ui-hn__sep")).not.toBeNull();
      const me = avatar(el);
      expect(me.getAttribute("aria-label")).toBe("Account: Ada Lovelace");
      expect(me.getAttribute("aria-haspopup")).toBe("dialog");
      expect(me.getAttribute("aria-expanded")).toBe("false");
      expect(document.getElementById(me.getAttribute("aria-describedby")!)!.textContent).toBe("Online");
      expect(el.querySelector(".ui-hn__face")!.getAttribute("data-initials")).toBe("AL");
      expect(el.querySelector(".ui-hn__dot")!.getAttribute("data-presence")).toBe("online");
      // Children inherit an explicit look
      expect(el.querySelector("tc-notifications")!.getAttribute("data-look")).toBe(look);
    });
  }

  test("initials and tone: one or two letters, the same tone every time", () => {
    expect(headerNavInitials("Ada Lovelace")).toBe("AL");
    expect(headerNavInitials("  priya ")).toBe("P");
    expect(headerNavInitials("Jean Luc Picard")).toBe("JP");
    expect(headerNavTone("Ada Lovelace")).toBe(headerNavTone("Ada Lovelace"));
  });

  test("children added after it's on the page still come before the avatar", async () => {
    const el = await fixture<TcHeaderNav>(html`<tc-header-nav .user=${USER}></tc-header-nav>`);
    expect(el.querySelector(".ui-hn__sep")).toBeNull();
    const n = document.createElement("tc-notifications");
    const a = document.createElement("tc-app-picker");
    el.append(n, a);
    await settle();
    await expect.poll(() => tabOrder(el)).toEqual(["ui-ntc__trigger", "ui-apk__trigger", "ui-hn__me"]);
    await expect.poll(() => el.querySelector(".ui-hn__sep")).not.toBeNull();
    el.separator = false;
    await settle();
    expect(el.querySelector(".ui-hn__sep")).toBeNull();
  });

  test("the account card: a dialog named Account that takes focus; Escape closes it with focus back on the avatar", async () => {
    const el = await make();
    const changes: HeaderNavPanelChange[] = [];
    el.addEventListener("tc-panel-change", (e) => changes.push((e as CustomEvent<HeaderNavPanelChange>).detail));
    avatar(el).click();
    await settle();
    expect(changes).toEqual([{ panel: "account" }]);
    const dialog = pop(el)!;
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-label")).toBe("Account");
    expect(avatar(el).getAttribute("aria-expanded")).toBe("true");
    expect(avatar(el).getAttribute("aria-controls")).toBe(dialog.id);
    await expect.poll(() => document.activeElement?.closest(".ui-hn__pop")).toBe(dialog);
    // The default actions
    expect([...dialog.querySelectorAll(".ui-pm__item, [class*='ui-pm__item']")].length).toBeGreaterThan(0);
    expect(dialog.textContent).toContain("Sign out");
    expect(dialog.textContent).toContain("ada@example.com");
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(el.panel).toBe(null);
    expect(pop(el)).toBeNull();
    expect(document.activeElement).toBe(avatar(el));
    expect(changes.at(-1)).toEqual({ panel: null });
  });

  test("the card sits under the avatar, inside the viewport", async () => {
    const el = await make();
    el.style.cssText = "position: fixed; top: 8px; right: 8px";
    avatar(el).click();
    await settle();
    const dialog = pop(el)!;
    await expect.poll(() => dialog.hasAttribute("data-placed")).toBe(true);
    const a = avatar(el).getBoundingClientRect();
    const d = dialog.getBoundingClientRect();
    expect(d.top).toBeGreaterThanOrEqual(a.bottom);
    expect(d.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
    expect(d.left).toBeGreaterThanOrEqual(0);
  });

  test("one popover at a time: opening the bell closes the card", async () => {
    const el = await make();
    avatar(el).click();
    await settle();
    expect(el.panel).toBe("account");
    bell(el).click();
    await settle();
    expect(el.panel).toBe("notifications");
    expect(pop(el)).toBeNull();
    expect(el.querySelector<HTMLElement & { open: boolean }>("tc-notifications")!.open).toBe(true);
    avatar(el).click();
    await settle();
    expect(el.panel).toBe("account");
    expect(el.querySelector<HTMLElement & { open: boolean }>("tc-notifications")!.open).toBe(false);
  });

  test("tc-panel-change prevented: nothing opens (controlled use)", async () => {
    const el = await make();
    el.addEventListener("tc-panel-change", (e) => e.preventDefault());
    avatar(el).click();
    await settle();
    expect(el.panel).toBe(null);
    expect(pop(el)).toBeNull();
    bell(el).click();
    await settle();
    expect(el.querySelector<HTMLElement & { open: boolean }>("tc-notifications")!.open).toBe(false);
    // Set from outside, it opens
    el.panel = "account";
    await settle();
    expect(pop(el)).not.toBeNull();
  });

  test("an account action reports its id, closes the card and returns focus; prevented, the card stays", async () => {
    const el = await make();
    const picked: string[] = [];
    let keep = true;
    el.addEventListener("tc-account-select", (e) => {
      picked.push((e as CustomEvent<HeaderNavAccountSelect>).detail.id);
      if (keep) e.preventDefault();
    });
    let leaked = 0;
    document.addEventListener("tc-item-select", () => leaked++);
    avatar(el).click();
    await settle();
    const signOut = () => [...pop(el)!.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.includes("Sign out"))!;
    await expect.poll(() => !!signOut()).toBe(true);
    signOut().click();
    await settle();
    expect(picked).toEqual(["sign-out"]);
    expect(pop(el)).not.toBeNull();
    keep = false;
    signOut().click();
    await settle();
    expect(pop(el)).toBeNull();
    expect(document.activeElement).toBe(avatar(el));
    // The card's own event stays inside
    expect(leaked).toBe(0);
  });

  test("the account card's defaults end Docs, Terms and Conditions, Sign out; Terms and Conditions reports id terms", async () => {
    const el = await make();
    const picked: string[] = [];
    el.addEventListener("tc-account-select", (e) => picked.push((e as CustomEvent<HeaderNavAccountSelect>).detail.id));
    avatar(el).click();
    await expect.poll(() => pop(el)?.querySelectorAll("tc-profile-menu button").length ?? 0).toBeGreaterThan(3);
    const labels = [...pop(el)!.querySelectorAll<HTMLButtonElement>("tc-profile-menu button")].map((b) => b.textContent!.replace(/\s+/g, " ").trim());
    expect(labels.slice(-3)).toEqual(["Docs", "Terms and Conditions", "Sign out"]);
    [...pop(el)!.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.includes("Terms and Conditions"))!.click();
    await settle();
    expect(picked).toEqual(["terms"]);
    expect(pop(el)).toBeNull();
  });

  test("each trigger shows its name in a tooltip on keyboard focus – also inverse; Escape hides it, and it's hidden while open", async () => {
    const wrap = await fixture(html`<div style="padding: 8px 8px 64px; background: #081d35">
      <tc-header-nav inverse .user=${USER}>
        <tc-notifications .now=${NOW} .items=${ITEMS}></tc-notifications>
        <tc-app-picker current="mail" .apps=${APPS}></tc-app-picker>
      </tc-header-nav>
    </div>`);
    const el = wrap.querySelector<TcHeaderNav>("tc-header-nav")!;
    await settle();
    const tips = [
      [".ui-ntc__trigger", ".ui-ntc__tip", "Notifications"],
      [".ui-apk__trigger", ".ui-apk__tip", "Apps"],
      [".ui-hn__me", ".ui-hn__tip", "Account: Ada Lovelace"],
    ] as const;
    const shown = (sel: string) => getComputedStyle(el.querySelector(sel)!).visibility === "visible";
    for (const [, tip, name] of tips) {
      expect(el.querySelector(tip)!.textContent).toBe(name);
      expect(el.querySelector(tip)!.getAttribute("aria-hidden")).toBe("true");
      expect(shown(tip)).toBe(false);
    }
    // Ink on the dark bar: the tooltip uses the tooltip tokens, resolved in the trigger's dark scheme
    expect(getComputedStyle(el.querySelector(".ui-hn__tip")!).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    for (const [trigger, tip] of tips) {
      el.querySelector<HTMLElement>(trigger)!.focus({ focusVisible: true } as FocusOptions);
      await expect.poll(() => shown(tip), { message: tip }).toBe(true);
      el.querySelector(trigger)!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await expect.poll(() => shown(tip), { message: tip }).toBe(false);
      el.querySelector(trigger)!.removeAttribute("data-hush");
    }
    el.panel = "account";
    await settle();
    expect(shown(".ui-hn__tip")).toBe(false);
  });

  test("a switch item in the account card reports its new state and keeps the card open; the page sets it", async () => {
    const el = await make();
    let dark = false;
    const items = () => [
      { id: "dark", label: "Dark mode", checked: dark },
      { id: "sign-out", label: "Sign out" },
    ];
    el.accountItems = items();
    const picked: HeaderNavAccountSelect[] = [];
    el.addEventListener("tc-account-select", (e) => {
      const d = (e as CustomEvent<HeaderNavAccountSelect>).detail;
      picked.push(d);
      if (d.checked !== undefined) {
        dark = d.checked;
        el.accountItems = items();
      }
    });
    avatar(el).click();
    await settle();
    const toggle = () => pop(el)?.querySelector<HTMLButtonElement>('[role="switch"]');
    await expect.poll(() => !!toggle()).toBe(true);
    expect(toggle()!.getAttribute("aria-checked")).toBe("false");
    toggle()!.focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(picked).toEqual([{ id: "dark", checked: true }]);
    expect(pop(el)).not.toBeNull();
    expect(toggle()!.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(toggle());
    toggle()!.click();
    await settle();
    expect(picked.at(-1)).toEqual({ id: "dark", checked: false });
    expect(pop(el)).not.toBeNull();
    // A plain action still closes it, with no checked in its detail
    [...pop(el)!.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.includes("Sign out"))!.click();
    await settle();
    expect(picked.at(-1)).toEqual({ id: "sign-out" });
    expect(pop(el)).toBeNull();
  });

  test("React: onAccountSelect gets a switch item's new state", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: [string, boolean | undefined][] = [];
    function App() {
      const [dark, setDark] = React.useState(false);
      return React.createElement(HeaderNav, {
        user: USER,
        defaultOpen: "account",
        accountItems: [{ id: "dark", label: "Dark mode", checked: dark }],
        onAccountSelect: (id: string, checked?: boolean) => {
          calls.push([id, checked]);
          if (checked !== undefined) setDark(checked);
        },
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const toggle = () => host.querySelector<HTMLButtonElement>('.ui-hn__pop [role="switch"]');
    await expect.poll(() => !!toggle()).toBe(true);
    await act(async () => toggle()!.click());
    await settle();
    expect(calls).toEqual([["dark", true]]);
    expect(toggle()!.getAttribute("aria-checked")).toBe("true");
    await act(async () => root.unmount());
    host.remove();
  });

  test("sized from the page: the triggers, their icons, the face and its initials, reaching the bell and the picker", async () => {
    const el = await make("clean");
    const size = (sel: string) => {
      const r = el.querySelector(sel)!.getBoundingClientRect();
      return [Math.round(r.width), Math.round(r.height)];
    };
    // Defaults: the control heights and an 18px icon
    expect(size(".ui-hn__me")).toEqual(size(".ui-ntc__trigger"));
    expect(size(".ui-ntc__bell")).toEqual([18, 18]);
    el.style.cssText = "--tc-hn-trigger-size: 40px; --tc-hn-icon-size: 22px; --tc-hn-face-size: 34px; --tc-hn-initials-size: 17px";
    for (const sel of [".ui-ntc__trigger", ".ui-apk__trigger", ".ui-hn__me"]) expect(size(sel), sel).toEqual([40, 40]);
    expect(size(".ui-ntc__bell")).toEqual([22, 22]);
    expect(size(".ui-apk__waffle")).toEqual([22, 22]);
    expect(size(".ui-hn__face")).toEqual([34, 34]);
    expect(getComputedStyle(el.querySelector(".ui-hn__face")!).fontSize).toBe("17px");
    // The account card's face keeps its own size
    el.panel = "account";
    await settle();
    await expect.poll(() => !!el.querySelector(".ui-hn__pop tc-profile-menu .ui-hn__face")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-hn__pop tc-profile-menu .ui-hn__face")!).fontSize).not.toBe("17px");
  });

  test("inverse: on a light page the triggers take dark colours for a dark bar; the popovers keep the page's light theme", async () => {
    const wrap = await fixture(html`<div data-tc-theme="light" style="padding: 16px">
      <div class="probe-light"><span class="fg" style="color: var(--tc-action-ghost-fg)"></span><span class="bg" style="background: var(--tc-surface-raised)"></span><span class="sep" style="background: var(--tc-border-default)"></span></div>
      <div class="probe-dark" data-tc-theme="dark"><span class="fg" style="color: var(--tc-action-ghost-fg)"></span><span class="bg" style="background: var(--tc-surface-raised)"></span><span class="sep" style="background: var(--tc-border-default)"></span><span class="ring" style="outline: 2px solid var(--tc-focus-ring)"></span></div>
      <div style="background: #081d35; padding: 8px">
        <tc-header-nav inverse .user=${USER}>
          <tc-notifications .now=${NOW} .items=${ITEMS}></tc-notifications>
          <tc-app-picker current="mail" .apps=${APPS}></tc-app-picker>
        </tc-header-nav>
      </div>
    </div>`);
    const el = wrap.querySelector<TcHeaderNav>("tc-header-nav")!;
    await settle();
    expect(el.hasAttribute("inverse")).toBe(true);
    const style = (sel: string, root: Element = wrap) => getComputedStyle(root.querySelector(sel)!);
    const light = { fg: style(".probe-light .fg").color, bg: style(".probe-light .bg").backgroundColor, sep: style(".probe-light .sep").backgroundColor };
    const dark = { fg: style(".probe-dark .fg").color, bg: style(".probe-dark .bg").backgroundColor, sep: style(".probe-dark .sep").backgroundColor, ring: style(".probe-dark .ring").outlineColor };
    expect(dark.fg).not.toBe(light.fg);
    // Every trigger resolves the dark theme's colours, with the page still light
    for (const sel of [".ui-ntc__trigger", ".ui-apk__trigger", ".ui-hn__me"]) expect(style(sel, el).color, sel).toBe(dark.fg);
    expect(style(".ui-hn__sep", el).backgroundColor).toBe(dark.sep);
    // The focus ring is the dark theme's, made for dark surfaces
    const probe = document.createElement("span");
    probe.style.outline = "2px solid var(--tc-focus-ring)";
    el.querySelector(".ui-hn__me")!.append(probe);
    expect(getComputedStyle(probe).outlineColor).toBe(dark.ring);
    probe.remove();
    // The unread badge is ringed in --tc-hn-ring, which the page can set to the bar's colour
    el.style.setProperty("--tc-hn-ring", "#081d35");
    expect(style(".ui-ntc__badge", el).boxShadow).toContain("rgb(8, 29, 53)");

    // The popovers keep the page's light theme
    el.panel = "account";
    await settle();
    await expect.poll(() => !!el.querySelector(".ui-hn__pop tc-profile-menu .ui-pm__card")).toBe(true);
    expect(style(".ui-hn__pop .ui-pm__card", el).backgroundColor).not.toBe(dark.bg);
    expect(getComputedStyle(el.querySelector(".ui-hn__pop")!).colorScheme).not.toBe("dark");
    el.panel = "notifications";
    await settle();
    await expect.poll(() => !!el.querySelector(".ui-ntc__pop")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-ntc__pop")!).colorScheme).toBe("light");
    expect(style(".ui-ntc__pop", el).backgroundColor).not.toBe(dark.bg);
    el.panel = "apps";
    await settle();
    await expect.poll(() => !!el.querySelector(".ui-apk__pop")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-apk__pop")!).colorScheme).toBe("light");

    // Without inverse the triggers are the page's own again
    el.panel = null;
    el.inverse = false;
    await settle();
    expect(el.hasAttribute("inverse")).toBe(false);
    expect(style(".ui-hn__me", el).color).toBe(light.fg);
  });

  test("a photo, falling back to initials when it fails to load; an unsafe URL is never used", async () => {
    const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const el = await fixture<TcHeaderNav>(html`<tc-header-nav .user=${{ ...USER, avatar: PIXEL }}></tc-header-nav>`);
    expect(el.querySelector("img.ui-hn__face")).not.toBeNull();
    el.user = { ...USER, avatar: "/nope-404.png" };
    await expect.poll(() => el.querySelector("span.ui-hn__face")?.getAttribute("data-initials")).toBe("AL");
    el.user = { ...USER, avatar: "javascript:alert(1)" };
    await settle();
    expect(el.querySelector("img")).toBeNull();
  });

  test("narrow: the card stays inside a 320 px viewport", async () => {
    const el = await make();
    el.style.cssText = "position: fixed; top: 8px; left: 8px";
    const frame = document.documentElement.clientWidth;
    avatar(el).click();
    await settle();
    const dialog = pop(el)!;
    await expect.poll(() => dialog.hasAttribute("data-placed")).toBe(true);
    const d = dialog.getBoundingClientRect();
    expect(d.left).toBeGreaterThanOrEqual(0);
    expect(d.right).toBeLessThanOrEqual(frame);
  });

  test("React: uncontrolled opens and closes; controlled waits for the parent", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const reports: (string | null)[] = [];
    await act(async () =>
      root.render(React.createElement(HeaderNav, { user: USER, notifications: { now: NOW, items: ITEMS }, apps: { apps: APPS, current: "mail" }, onOpenChange: (p) => void reports.push(p) })),
    );
    await settle();
    const el = host.querySelector("tc-header-nav")!;
    expect(tabOrder(el)).toEqual(["ui-ntc__trigger", "ui-apk__trigger", "ui-hn__me"]);
    await act(async () => avatar(el).click());
    await settle();
    expect(reports).toEqual(["account"]);
    expect(pop(el)).not.toBeNull();
    await act(async () => bell(el).click());
    await settle();
    expect(reports).toEqual(["account", "notifications"]);
    expect(pop(el)).toBeNull();

    // Controlled: a click asks; nothing opens until the parent says so
    const asked: (string | null)[] = [];
    await act(async () => root.render(React.createElement(HeaderNav, { user: USER, open: null, onOpenChange: (p) => void asked.push(p) })));
    await settle();
    await act(async () => avatar(el).click());
    await settle();
    expect(asked).toEqual(["account"]);
    expect(pop(el)).toBeNull();
    await act(async () => root.render(React.createElement(HeaderNav, { user: USER, open: "account", onOpenChange: (p) => void asked.push(p) })));
    await settle();
    expect(pop(el)).not.toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, card open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="display: flex; justify-content: flex-end; gap: 24px; padding: 16px; background: var(--tc-surface-base)">
        <tc-header-nav .user=${USER} panel="account"><tc-notifications .now=${NOW} .items=${ITEMS}></tc-notifications><tc-app-picker .apps=${APPS}></tc-app-picker></tc-header-nav>
        <tc-header-nav look="clean" .user=${{ ...USER, presence: "busy" }}><tc-notifications .now=${NOW} .items=${ITEMS}></tc-notifications></tc-header-nav>
      </div>`);
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
