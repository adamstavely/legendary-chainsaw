/*
 * <tc-app-picker> in real browsers: the host and both looks, the button and its popover (focus, Escape and focus
 * return), sections, tiles as links, the grid's keyboard, search, tc-app-select and its cancelation, modified clicks,
 * pins, loading / error / empty, columns at narrow widths, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/app-picker";
import { appMatch, appTone, TcAppPicker, type AppPickerApp, type AppPickerPinDetail, type AppPickerSelectDetail } from "../../src/elements/app-picker";
import { AppPicker } from "../../src/elements/react/app-picker";
import { cleanup, finish, fixture, parkPointer, settle } from "./helpers";

afterEach(cleanup);

const svgIcon = () => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.classList.add("own-icon");
  return s;
};
const PIXEL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4'><rect width='4' height='4' fill='%23f60'/></svg>";

const APPS: AppPickerApp[] = [
  { id: "mail", name: "Mail", href: "#mail", description: "Inbox, calendar and contacts", keywords: ["email", "inbox"] },
  { id: "docs", name: "Docs", href: "#docs", description: "Write together" },
  { id: "sheets", name: "Sheets", href: "#sheets", icon: svgIcon() },
  { id: "slides", name: "Slides", href: "#slides", image: PIXEL },
  { id: "drive", name: "Drive", href: "#drive", target: "_blank" },
  { id: "chat", name: "Chat", href: "#chat", tone: "teal" },
  { id: "meet", name: "Meet", href: "#meet" },
  { id: "forms", name: "Forms" },
];
const MANY: AppPickerApp[] = [...APPS, { id: "sites", name: "Sites", href: "#sites" }, { id: "keep", name: "Keep notes", href: "#keep" }];
const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

type Opts = { look?: string; apps?: AppPickerApp[]; layout?: string; pinned?: string[]; recent?: string[]; current?: string; search?: string; pinnable?: boolean; footer?: boolean; style?: string };
const make = (o: Opts = {}) =>
  fixture<TcAppPicker>(html`<tc-app-picker
    look=${o.look ?? "standard"}
    layout=${o.layout ?? "trigger"}
    current=${o.current ?? ""}
    search=${o.search ?? "auto"}
    ?pinnable=${o.pinnable}
    footer-href=${o.footer ? "#all-apps" : ""}
    style=${o.style ?? ""}
    .apps=${o.apps ?? APPS}
    .pinned=${o.pinned ?? []}
    .recent=${o.recent ?? []}
  ></tc-app-picker>`);
const trigger = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-apk__trigger")!;
const pop = (el: Element) => el.querySelector<HTMLElement>(".ui-apk__pop");
const tiles = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-apk__tile")];
const tile = (el: Element, key: string) => el.querySelector<HTMLElement>(`.ui-apk__tile[data-key="${key}"]`)!;
const names = (el: Element, section?: string) =>
  [...el.querySelectorAll(`${section ? `[data-section="${section}"] ` : ""}.ui-apk__tile .ui-apk__name`)].map((n) => plain(n.textContent));
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);
const active = () => document.activeElement as HTMLElement;
const openPanel = async (el: TcAppPicker) => {
  trigger(el).click();
  await settle();
};
/** Clicks without following the link: a document listener (after the element's) records and then stops it */
const clickStopped = async (target: HTMLElement, init: MouseEventInit = {}) => {
  let prevented: boolean | null = null;
  const stop = (e: Event) => {
    prevented = e.defaultPrevented;
    e.preventDefault();
  };
  document.addEventListener("click", stop, { once: true });
  target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init }));
  document.removeEventListener("click", stop);
  await settle();
  return prevented;
};

describe("tc-app-picker", () => {
  for (const look of looks) {
    test(`${look}: the host, and a button named “Apps” with aria-haspopup and aria-expanded`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("apk");
      expect(el.dataset.look).toBe(look);
      const b = trigger(el);
      expect(b.getAttribute("aria-label")).toBe("Apps");
      expect(b.getAttribute("aria-haspopup")).toBe("dialog");
      expect(b.getAttribute("aria-expanded")).toBe("false");
      expect(pop(el)).toBeNull();
      await openPanel(el);
      expect(b.getAttribute("aria-expanded")).toBe("true");
      expect(b.getAttribute("aria-controls")).toBe(pop(el)!.id);
      expect(pop(el)!.getAttribute("role")).toBe("dialog");
      expect(pop(el)!.getAttribute("aria-label")).toBe("Apps");
      // The popover carries no card header
      expect(pop(el)!.querySelector(".tc-head")).toBeNull();
    });

    test(`${look}: the panel layout is a region with the card header`, async () => {
      const el = await make({ look, layout: "panel" });
      expect(el.getAttribute("role")).toBe("region");
      expect(trigger(el)).toBeNull();
      const title = el.querySelector(".tc-head__title")!;
      expect(plain(title.textContent)).toBe("Apps");
      expect(el.getAttribute("aria-labelledby")).toBe(title.id);
      expect(tiles(el)).toHaveLength(APPS.length);
    });
  }

  test("opening with few apps: no search, focus on the current app; Escape closes and returns focus to the button", async () => {
    const el = await make({ current: "sheets" });
    const events: boolean[] = [];
    el.addEventListener("tc-open-change", (e) => events.push((e as CustomEvent<{ open: boolean }>).detail.open));
    trigger(el).focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(pop(el)).not.toBeNull();
    expect(el.querySelector(".ui-apk__input")).toBeNull();
    expect(active()).toBe(tile(el, "all:sheets"));
    expect(active().getAttribute("aria-current")).toBe("true");
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(pop(el)).toBeNull();
    expect(el.open).toBe(false);
    expect(active()).toBe(trigger(el));
    expect(events).toEqual([true, false]);
  });

  test("↓ on the button opens it too; with no current app focus goes to the first tile", async () => {
    const el = await make();
    trigger(el).focus();
    await userEvent.keyboard("{ArrowDown}");
    await settle();
    expect(el.open).toBe(true);
    expect(active()).toBe(tile(el, "all:mail"));
  });

  test("opening with many apps: focus in the search field first; ↓ moves into the grid, ↑ from the top row back", async () => {
    const el = await make({ apps: MANY });
    await openPanel(el);
    const input = el.querySelector<HTMLInputElement>(".ui-apk__input")!;
    expect(active()).toBe(input);
    expect(input.type).toBe("search");
    expect(input.getAttribute("aria-label")).toBe("Search apps");
    await userEvent.keyboard("{ArrowDown}");
    expect(active()).toBe(tile(el, "all:mail"));
    await userEvent.keyboard("{ArrowUp}");
    expect(active()).toBe(input);
  });

  test("search: on, off and the threshold", async () => {
    const el = await make({ layout: "panel" });
    expect(el.querySelector(".ui-apk__input")).toBeNull();
    el.search = "on";
    await settle();
    expect(el.querySelector(".ui-apk__input")).not.toBeNull();
    el.search = "auto";
    el.searchThreshold = 8;
    await settle();
    expect(el.querySelector(".ui-apk__input")).not.toBeNull();
    el.search = "off";
    el.apps = MANY;
    await settle();
    expect(el.querySelector(".ui-apk__input")).toBeNull();
  });

  test("sections: Pinned, Recent (without the pinned ones) and All apps, each grid named by its heading", async () => {
    const el = await make({ layout: "panel", pinned: ["docs", "mail"], recent: ["mail", "chat", "gone", "meet"] });
    const labels = [...el.querySelectorAll(".ui-apk__label")];
    expect(labels.map((l) => plain(l.textContent))).toEqual(["Pinned", "Recent", "All apps"]);
    expect(labels[0].getAttribute("role")).toBe("heading");
    expect(names(el, "pinned")).toEqual(["Docs", "Mail"]);
    expect(names(el, "recent")).toEqual(["Chat", "Meet"]);
    expect(names(el, "all")).toHaveLength(APPS.length);
    const grids = [...el.querySelectorAll('[role="grid"]')];
    expect(grids).toHaveLength(3);
    expect(grids[1].getAttribute("aria-labelledby")).toBe(labels[1].id);
    // Rows and cells
    expect(grids[2].querySelectorAll('[role="row"]').length).toBe(2);
    expect(grids[2].querySelectorAll('[role="gridcell"]').length).toBe(APPS.length);
  });

  test("one section has no heading – the grid is named after the panel; groups replace All apps", async () => {
    const el = await make({ layout: "panel" });
    expect(el.querySelector(".ui-apk__label")).toBeNull();
    expect(el.querySelector('[role="grid"]')!.getAttribute("aria-label")).toBe("Apps");
    el.apps = [
      { id: "crm", name: "CRM", group: "Sales" },
      { id: "quotes", name: "Quotes", group: "Sales" },
      { id: "hr", name: "People", group: "Team" },
      { id: "wiki", name: "Wiki" },
    ];
    await settle();
    expect([...el.querySelectorAll(".ui-apk__label")].map((l) => plain(l.textContent))).toEqual(["Sales", "Team", "More apps"]);
    el.labels = { other: "Other" };
    await settle();
    expect(plain(el.querySelectorAll(".ui-apk__label")[2].textContent)).toBe("Other");
  });

  test("tiles are real links – href, target – the current app marked, the description read with the name", async () => {
    const el = await make({ layout: "panel", current: "mail" });
    const mail = tile(el, "all:mail") as HTMLAnchorElement;
    expect(mail.tagName).toBe("A");
    expect(mail.getAttribute("href")).toBe("#mail");
    expect(mail.getAttribute("aria-current")).toBe("true");
    expect(plain(mail.textContent)).toContain("current app");
    expect(plain(document.getElementById(mail.getAttribute("aria-describedby")!)!.textContent)).toBe("Inbox, calendar and contacts");
    const drive = tile(el, "all:drive") as HTMLAnchorElement;
    expect(drive.target).toBe("_blank");
    expect(drive.rel).toBe("noopener");
    expect(drive.hasAttribute("aria-current")).toBe(false);
    // No href: a button
    expect(tile(el, "all:forms").tagName).toBe("BUTTON");
    // One tab stop
    expect(tiles(el).filter((t) => t.tabIndex === 0)).toEqual([mail]);
  });

  test("icons: the app's own element (cloned), an image, or initials on a palette colour", async () => {
    const el = await make({ layout: "panel" });
    const icon = (id: string) => tile(el, `all:${id}`).querySelector<HTMLElement>(".ui-apk__icon")!;
    expect(icon("sheets").dataset.kind).toBe("element");
    expect(icon("sheets").querySelector(".own-icon")).not.toBe(APPS[2].icon);
    expect(icon("slides").dataset.kind).toBe("image");
    expect(icon("slides").querySelector("img")!.getAttribute("alt")).toBe("");
    expect(icon("mail").dataset.kind).toBe("initials");
    expect(plain(icon("mail").textContent)).toBe("M");
    expect(icon("mail").dataset.tone).toBe(appTone("mail"));
    expect(icon("chat").dataset.tone).toBe("teal");
    expect(getComputedStyle(icon("chat")).backgroundColor).not.toBe(getComputedStyle(icon("sheets")).backgroundColor);
  });

  test("the grid's keys: ← → in order, ↑ ↓ by column across sections, Home and End", async () => {
    // Pinned has 2 tiles, All has 8 in rows of 4
    const el = await make({ layout: "panel", pinned: ["docs", "mail"], style: "width: 420px" });
    expect(el.querySelector<HTMLElement>(".ui-apk__card")!.style.getPropertyValue("--apk-cols")).toBe("4");
    tile(el, "pinned:docs").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(active()).toBe(tile(el, "pinned:mail"));
    await userEvent.keyboard("{ArrowRight}");
    expect(active()).toBe(tile(el, "all:mail"));
    await userEvent.keyboard("{ArrowLeft}");
    expect(active()).toBe(tile(el, "pinned:mail"));
    // ↓ from column 2 of Pinned → column 2 of All's first row
    await userEvent.keyboard("{ArrowDown}");
    expect(active()).toBe(tile(el, "all:docs"));
    await userEvent.keyboard("{ArrowDown}");
    expect(active()).toBe(tile(el, "all:chat"));
    await userEvent.keyboard("{ArrowDown}");
    expect(active()).toBe(tile(el, "all:chat"));
    // ↑ ↑ from the second row, column 2 → All row 1 → Pinned (column 2)
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(active()).toBe(tile(el, "pinned:mail"));
    await userEvent.keyboard("{End}");
    expect(active()).toBe(tile(el, "all:forms"));
    await userEvent.keyboard("{Home}");
    expect(active()).toBe(tile(el, "pinned:docs"));
    // Roving tab stop
    expect(tile(el, "pinned:docs").tabIndex).toBe(0);
    expect(tile(el, "all:forms").tabIndex).toBe(-1);
  });

  test("columns follow the room: four at most, three in a 320 px panel, `columns` caps them", async () => {
    const el = await make({ layout: "panel", style: "width: 320px" });
    const cols = () => el.querySelector<HTMLElement>(".ui-apk__card")!.style.getPropertyValue("--apk-cols");
    expect(cols()).toBe("3");
    expect(el.querySelector('[role="grid"]')!.querySelectorAll('[role="row"]').length).toBe(3);
    el.style.width = "420px";
    await expect.poll(cols, { timeout: 3000 }).toBe("4");
    await settle();
    el.columns = 2;
    await settle();
    expect(cols()).toBe("2");
    // Nothing spills out
    for (const t of tiles(el)) expect(t.getBoundingClientRect().right).toBeLessThanOrEqual(el.getBoundingClientRect().right + 0.5);
  });

  test("the popover stays inside the viewport, anchored under the button at the right edge", async () => {
    const el = await make({ style: "position: fixed; top: 8px; right: 8px" });
    await openPanel(el);
    await finish();
    const r = pop(el)!.getBoundingClientRect();
    expect(r.left).toBeGreaterThanOrEqual(0);
    expect(r.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
    expect(r.top).toBeGreaterThanOrEqual(trigger(el).getBoundingClientRect().bottom);
  });

  test("a plain click fires tc-app-select; the link is followed unless it's prevented; the panel closes and focus returns", async () => {
    const el = await make();
    const picked: AppPickerSelectDetail[] = [];
    el.addEventListener("tc-app-select", (e) => picked.push((e as CustomEvent<AppPickerSelectDetail>).detail));
    trigger(el).focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(await clickStopped(tile(el, "all:docs"))).toBe(false);
    expect(picked.map((d) => d.id)).toEqual(["docs"]);
    expect(picked[0].app.name).toBe("Docs");
    expect(pop(el)).toBeNull();
    expect(active()).toBe(trigger(el));
    // Prevented: no navigation (SPA routing)
    el.addEventListener("tc-app-select", (e) => e.preventDefault(), { once: true });
    await openPanel(el);
    expect(await clickStopped(tile(el, "all:mail"))).toBe(true);
    expect(picked.map((d) => d.id)).toEqual(["docs", "mail"]);
  });

  test("Enter on a tile picks it through the link's own click", async () => {
    const el = await make({ layout: "panel" });
    const picked: string[] = [];
    el.addEventListener("tc-app-select", (e) => {
      e.preventDefault();
      picked.push((e as CustomEvent<AppPickerSelectDetail>).detail.id);
    });
    tile(el, "all:meet").focus();
    await userEvent.keyboard("{Enter}");
    // A tile without href is a button: Enter and Space both pick
    tile(el, "all:forms").focus();
    await userEvent.keyboard(" ");
    expect(picked).toEqual(["meet", "forms"]);
  });

  test("⌘ / Ctrl / Shift clicks are the browser's (a new tab): no tc-app-select, nothing prevented, the panel stays open", async () => {
    const el = await make();
    let fired = 0;
    el.addEventListener("tc-app-select", () => fired++);
    await openPanel(el);
    for (const mod of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }]) expect(await clickStopped(tile(el, "all:mail"), mod)).toBe(false);
    expect(fired).toBe(0);
    expect(pop(el)).not.toBeNull();
  });

  test("search filters as you type, best matches first, on name, description and keywords; status says how many", async () => {
    const el = await make({ apps: MANY, layout: "panel", pinned: ["docs"] });
    const input = el.querySelector<HTMLInputElement>(".ui-apk__input")!;
    input.focus();
    await userEvent.keyboard("s");
    await settle();
    // Starts with "s" first (Sheets, Slides, Sites), then a word starting with it (Keep notes? no) …
    expect(names(el).slice(0, 3)).toEqual(["Sheets", "Slides", "Sites"]);
    expect(el.querySelector(".ui-apk__label")).toBeNull();
    await userEvent.keyboard("{Backspace}inbox");
    await settle();
    expect(names(el)).toEqual(["Mail"]);
    expect(status(el)).toBe("1 app");
    await userEvent.keyboard("{Backspace>5/}zzz");
    await settle();
    expect(tiles(el)).toHaveLength(0);
    expect(plain(el.querySelector(".ui-apk__empty")!.textContent)).toBe("No apps match “zzz”");
    expect(status(el)).toBe("No apps match “zzz”");
    expect(appMatch(MANY[9], "notes")).toBe(3);
    expect(appMatch(MANY[0], "")).toBe(1);
  });

  test("Enter in the search field opens the first match; Escape clears the search, then closes", async () => {
    const el = await make({ apps: MANY });
    const picked: string[] = [];
    el.addEventListener("tc-app-select", (e) => {
      e.preventDefault();
      picked.push((e as CustomEvent<AppPickerSelectDetail>).detail.id);
    });
    await openPanel(el);
    await userEvent.keyboard("dri");
    await settle();
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(pop(el)).not.toBeNull();
    expect(el.querySelector<HTMLInputElement>(".ui-apk__input")!.value).toBe("");
    expect(tiles(el)).toHaveLength(MANY.length);
    await userEvent.keyboard("dri{Enter}");
    await settle();
    expect(picked).toEqual(["drive"]);
    expect(pop(el)).toBeNull();
    // Reopened, the search starts empty
    await openPanel(el);
    expect(el.querySelector<HTMLInputElement>(".ui-apk__input")!.value).toBe("");
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(pop(el)).toBeNull();
    expect(active()).toBe(trigger(el));
  });

  test("Edit pins: tiles become pin toggles; tc-pin-change applies unless prevented", async () => {
    const el = await make({ layout: "panel", pinnable: true, pinned: ["mail"] });
    const edit = el.querySelector<HTMLButtonElement>(".ui-apk__edit")!;
    expect(plain(edit.textContent)).toBe("Edit pins");
    edit.click();
    await settle();
    expect(plain(edit.textContent)).toBe("Done");
    expect(el.querySelector('[data-section="pinned"]')).toBeNull();
    const mail = tile(el, "all:mail");
    expect(mail.tagName).toBe("BUTTON");
    expect(mail.getAttribute("aria-pressed")).toBe("true");
    // Named from its content – the icon is hidden: "Pin Mail"
    expect(plain([...mail.querySelectorAll(".ui-apk__sr, .ui-apk__name")].map((n) => n.textContent).join(""))).toBe("Pin Mail");
    expect(mail.hasAttribute("aria-label")).toBe(false);
    const changes: AppPickerPinDetail[] = [];
    el.addEventListener("tc-pin-change", (e) => changes.push((e as CustomEvent<AppPickerPinDetail>).detail));
    tile(el, "all:chat").focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(changes[0]).toEqual({ id: "chat", pinned: true, pins: ["mail", "chat"] });
    expect(el.pinned).toEqual(["mail", "chat"]);
    expect(tile(el, "all:chat").getAttribute("aria-pressed")).toBe("true");
    expect(active()).toBe(tile(el, "all:chat"));
    expect(status(el)).toBe("Chat pinned");
    // Prevented: the app owns the list
    el.addEventListener("tc-pin-change", (e) => e.preventDefault(), { once: true });
    tile(el, "all:mail").click();
    await settle();
    expect(changes[1]).toEqual({ id: "mail", pinned: false, pins: ["chat"] });
    expect(el.pinned).toEqual(["mail", "chat"]);
    edit.click();
    await settle();
    expect(names(el, "pinned")).toEqual(["Mail", "Chat"]);
  });

  test("the footer link, and the description line for the pointed-at or focused tile", async () => {
    const el = await make({ layout: "panel", footer: true });
    const more = el.querySelector<HTMLAnchorElement>(".ui-apk__more")!;
    expect(more.getAttribute("href")).toBe("#all-apps");
    expect(plain(more.textContent)).toBe("All apps");
    el.footerLabel = "Manage apps";
    el.footerTarget = "_blank";
    await settle();
    expect(plain(more.textContent)).toBe("Manage apps");
    expect(more.target).toBe("_blank");
    const hint = () => [...el.querySelector(".ui-apk__hint")!.children].map((c) => plain(c.textContent)).join(" ");
    expect(hint()).toBe("8 apps");
    tile(el, "all:mail").focus();
    await settle();
    expect(hint()).toBe("Mail Inbox, calendar and contacts");
    await userEvent.hover(tile(el, "all:docs"));
    await settle();
    expect(hint()).toBe("Docs Write together");
    await parkPointer();
    await settle();
    expect(hint()).toBe("Mail Inbox, calendar and contacts");
  });

  test("loading shows skeleton tiles and says so; error shows Retry (tc-retry); empty says so", async () => {
    const el = await make({ layout: "panel", apps: [] });
    expect(plain(el.querySelector(".ui-apk__empty")!.textContent)).toBe("No apps yet");
    el.loading = true;
    await settle();
    expect(el.querySelectorAll(".ui-apk__skeleton").length).toBe(8);
    expect(el.querySelector(".ui-apk__body")!.getAttribute("aria-busy")).toBe("true");
    expect(status(el)).toBe("Loading apps");
    el.loading = false;
    el.error = "Couldn't load your apps";
    await settle();
    expect(status(el)).toBe("Couldn't load your apps");
    let retried = 0;
    el.addEventListener("tc-retry", () => retried++);
    el.querySelector<HTMLButtonElement>(".ui-apk__retry")!.click();
    expect(retried).toBe(1);
    el.error = "";
    el.apps = APPS;
    await settle();
    expect(tiles(el)).toHaveLength(APPS.length);
  });

  test("tc-open-change is cancelable: prevented, the panel stays as it is", async () => {
    const el = await make();
    el.addEventListener("tc-open-change", (e) => e.preventDefault(), { once: true });
    trigger(el).click();
    await settle();
    expect(el.open).toBe(false);
    expect(pop(el)).toBeNull();
    trigger(el).click();
    await settle();
    expect(pop(el)).not.toBeNull();
    // A click outside closes it
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(el.open).toBe(false);
  });

  test("React: pinned survives a parent re-render; onSelect returning false stops the link; onOpenChange", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(
        "div",
        { "data-n": n },
        React.createElement(AppPicker, { layout: "panel", apps: APPS, pinnable: true, defaultPinned: ["mail"], onPinnedChange: (p) => calls.push(`pins:${p.join(",")}`), onSelect: (a) => (calls.push(`select:${a.id}`), false) }),
        React.createElement(AppPicker, { apps: APPS, open: false, onOpenChange: (o) => calls.push(`open:${o}`) }),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await act(async () => settle());
    const [panel, button] = [...host.querySelectorAll<TcAppPicker>("tc-app-picker")];
    panel.querySelector<HTMLButtonElement>(".ui-apk__edit")!.click();
    await act(async () => settle());
    tile(panel, "all:docs").click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await act(async () => settle());
    expect(panel.pinned).toEqual(["mail", "docs"]);
    panel.querySelector<HTMLButtonElement>(".ui-apk__edit")!.click();
    await act(async () => settle());
    expect(await clickStopped(tile(panel, "all:meet"))).toBe(true);
    trigger(button).click();
    await act(async () => settle());
    // Controlled closed: it reports, and stays closed
    expect(pop(button)).toBeNull();
    expect(calls).toEqual(["pins:mail,docs", "select:meet", "open:true"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look, the popover open, the panel, editing, loading and error (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-app-picker current="mail" footer-href="#all" .apps=${MANY} .pinned=${["docs"]} .recent=${["chat"]}></tc-app-picker>
        <tc-app-picker look="clean" current="docs" .apps=${APPS} .pinned=${["mail"]}></tc-app-picker>
        <tc-app-picker layout="panel" current="mail" pinnable footer-href="#all" .apps=${APPS} .pinned=${["sheets"]} .recent=${["meet"]}></tc-app-picker>
        <tc-app-picker layout="panel" look="clean" current="mail" pinnable .apps=${MANY}></tc-app-picker>
        <tc-app-picker layout="panel" loading></tc-app-picker>
        <tc-app-picker layout="panel" look="clean" error="Couldn't load your apps"></tc-app-picker>
      </div>`);
      const pickers = [...wrap.querySelectorAll<TcAppPicker>("tc-app-picker")];
      await openPanel(pickers[0]);
      pickers[3].querySelector<HTMLButtonElement>(".ui-apk__edit")!.click();
      await settle();
      await wait(300);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      expect(pop(pickers[0])).not.toBeNull();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      // The open popover is in the top layer, outside `wrap`'s box but inside its DOM: checked with the rest
      const own = await axe.run(pop(pickers[0])!, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, resultTypes: ["violations"] });
      expect(own.violations.map((v) => v.id)).toEqual([]);
    });
  }
});
