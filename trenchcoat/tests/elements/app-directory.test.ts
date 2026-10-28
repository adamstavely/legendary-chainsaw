/*
 * <tc-app-directory> in real browsers: the tray and card, categories and counts, search and the filter menu, the
 * connect flow (the short Connecting… state, a promise from onToggle that keeps the card pending and a rejection that
 * leaves it unconnected with an error), controlled `connected`, focus that never drops to <body>, the announcement,
 * the React wrapper and the block on it, narrow width and axe in both looks and both themes.
 * Ported from the jsdom regressions of blocks/app-directory.tsx.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/app-directory";
import type { DirectoryApp, DirectoryConnectedChange, TcAppDirectory } from "../../src/elements/app-directory";
import { AppDirectory } from "../../src/elements/react/app-directory";
import { AppDirectory as AppDirectoryBlock } from "../../blocks/app-directory";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const app = (id: string, name: string, extra: Partial<DirectoryApp> = {}): DirectoryApp => ({ id, name, vendor: "Acme", description: `${name} does things.`, categories: ["docs"], essential: true, ...extra });
const APPS = [app("slack", "Slack"), app("notion", "Notion"), app("figma", "Figma")];

const make = (props: Partial<TcAppDirectory> = {}, look: "standard" | "clean" = "standard") =>
  fixture<HTMLElement>(html`<div style="width: 1100px"><tc-app-directory look=${look} .apps=${APPS} .onToggle=${props.onToggle} .connected=${props.connected}></tc-app-directory></div>`).then(
    (w) => w.querySelector("tc-app-directory")!,
  );
const connectOf = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-adir__connect")].find((b) => b.textContent!.includes(name))!;
const stateOf = (el: Element, name: string) => connectOf(el, name)?.getAttribute("data-state");
/** The inner native button of a tc-button with this label */
const button = (el: Element, label: string) => [...el.querySelectorAll<HTMLButtonElement>("tc-button button")].find((b) => b.textContent!.includes(label))!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("<tc-app-directory>", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`structure (${look}): a named region, the bar, categories with counts and one card per app`, async () => {
      const el = await make({}, look);
      expect(el.dataset.ui).toBe("adir");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(el.getAttribute("aria-label")).toBe("Integrations");
      expect(el.querySelector(".ui-adir__bar-meta")!.textContent).toBe("0 connected");
      const nav = el.querySelector("nav[aria-label='Categories']")!;
      expect(nav.querySelector("[aria-current='true']")!.textContent).toContain("Essentials");
      expect(el.querySelectorAll(".ui-adir__app:not(.ui-adir__discover)")).toHaveLength(3);
      expect(el.querySelector(".ui-adir__heading")!.textContent).toContain("Essentials");
    });
  }

  test("defaults: the built-in apps and categories, Discover more and View all", async () => {
    const el = await fixture<TcAppDirectory>(html`<tc-app-directory></tc-app-directory>`);
    expect(el.apps.length).toBeGreaterThan(20);
    expect(el.querySelector(".ui-adir__bar-meta")!.textContent).toBe("1 connected");
    expect(el.querySelector(".ui-adir__discover")).toBeTruthy();
    button(el, "View all").click();
    await settle(el);
    expect(el.querySelector(".ui-adir__heading")!.textContent).toContain("All apps");
    expect(document.activeElement).toBe(el.querySelector("[data-category='all']"));
  });

  test("search matches name, vendor and description; no match shows Clear search, which focuses the field", async () => {
    const el = await make();
    const input = el.querySelector<HTMLInputElement>("input[type=search]")!;
    input.value = "notion";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle(el);
    expect(el.querySelector(".ui-adir__heading")!.textContent).toContain("Results for “notion”");
    expect(el.querySelectorAll(".ui-adir__app")).toHaveLength(1);
    input.value = "zzz";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle(el);
    expect(el.querySelector(".ui-adir__empty")!.textContent).toContain("No apps match.");
    const clear = button(el, "Clear search");
    clear.focus();
    clear.click();
    await settle(el);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("");
  });

  test("connecting shows Connecting… then Connected, fires tc-connected-change and announces it", async () => {
    const el = await make();
    const seen: DirectoryConnectedChange[] = [];
    el.addEventListener("tc-connected-change", (e) => seen.push((e as CustomEvent<DirectoryConnectedChange>).detail));
    connectOf(el, "Slack").click();
    await settle(el);
    expect(stateOf(el, "Slack")).toBe("busy");
    expect(connectOf(el, "Slack").getAttribute("aria-disabled")).toBe("true");
    await expect.poll(() => stateOf(el, "Slack"), { timeout: 3000 }).toBe("on");
    expect(seen.map((d) => [d.connected, d.app.id, d.on])).toEqual([[["slack"], "slack", true]]);
    expect(el.querySelector(":scope > [role='status']")!.textContent).toBe("Slack connected");
    expect(el.querySelector(".ui-adir__bar-meta")!.textContent).toBe("1 connected");
  });

  test("a promise from onToggle keeps the card pending; a rejection leaves it unconnected with the error", async () => {
    let reject!: (e: Error) => void;
    const calls: [string, boolean][] = [];
    const el = await make({ onToggle: (a, on) => (calls.push([a.id, on]), new Promise((_, r) => (reject = r))) });
    let changes = 0;
    el.addEventListener("tc-connected-change", () => changes++);
    connectOf(el, "Slack").click();
    await settle(el);
    expect(calls).toEqual([["slack", true]]);
    expect(stateOf(el, "Slack")).toBe("busy");
    await new Promise((r) => setTimeout(r, 1200));
    expect(stateOf(el, "Slack")).toBe("busy");
    reject(new Error("Slack said no"));
    await expect.poll(() => stateOf(el, "Slack")).toBe("off");
    expect(el.querySelector("[role='alert']")!.textContent).toBe("Slack said no");
    expect(changes).toBe(0);
  });

  test("a resolved promise connects at once", async () => {
    const el = await make({ onToggle: () => Promise.resolve() });
    connectOf(el, "Notion").click();
    await expect.poll(() => stateOf(el, "Notion")).toBe("on");
  });

  test("controlled: preventDefault keeps the list; a click on Connected only reports Disconnect", async () => {
    const el = await make({ connected: ["slack"] });
    expect(stateOf(el, "Slack")).toBe("on");
    const asked: string[][] = [];
    el.addEventListener("tc-connected-change", (e) => {
      e.preventDefault();
      asked.push((e as CustomEvent<DirectoryConnectedChange>).detail.connected);
    });
    connectOf(el, "Slack").click();
    await settle(el);
    expect(asked).toEqual([[]]);
    expect(stateOf(el, "Slack")).toBe("on");
    el.connected = [];
    await settle(el);
    expect(stateOf(el, "Slack")).toBe("off");
  });

  test("connect buttons are named by their visible label plus the app, without aria-label", async () => {
    const el = await make({ connected: ["slack"] });
    const name = (b: Element) => b.textContent!.replace(/\s+/g, " ").replace("ConnectedDisconnect", "Connected").trim();
    expect(name(connectOf(el, "Slack"))).toBe("Connected Slack");
    expect(name(connectOf(el, "Notion"))).toBe("Connect Notion");
    expect(connectOf(el, "Slack").hasAttribute("aria-label")).toBe(false);
  });

  test("the filter menu takes focus, arrows move, Escape and a choice return focus to the trigger", async () => {
    const el = await make();
    const trigger = () => el.querySelector<HTMLButtonElement>(".ui-adir__filter-btn button")!;
    trigger().click();
    await settle(el);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    const items = [...el.querySelectorAll<HTMLElement>("[role='menuitemradio']")];
    expect(document.activeElement).toBe(items[0]);
    key(items[0], "ArrowDown");
    expect(document.activeElement).toBe(items[1]);
    key(items[1], "End");
    expect(document.activeElement).toBe(items[2]);
    key(items[2], "Escape");
    await settle(el);
    expect(el.querySelector("[role='menu']")).toBeNull();
    expect(document.activeElement).toBe(trigger());
    trigger().click();
    await settle(el);
    [...el.querySelectorAll<HTMLElement>("[role='menuitemradio']")].find((i) => i.textContent!.includes("Not connected"))!.click();
    await settle(el);
    expect(trigger().textContent).toContain("Not connected");
    expect(document.activeElement).toBe(trigger());
    expect(el.querySelector(".ui-adir__filter-btn")!.hasAttribute("data-active")).toBe(true);
  });

  test("a press outside closes the menu", async () => {
    const el = await make();
    el.querySelector<HTMLButtonElement>(".ui-adir__filter-btn button")!.click();
    await settle(el);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle(el);
    expect(el.querySelector("[role='menu']")).toBeNull();
  });

  test("a card that leaves the filtered list hands focus to the next card's button", async () => {
    const el = await make();
    el.querySelector<HTMLButtonElement>(".ui-adir__filter-btn button")!.click();
    await settle(el);
    [...el.querySelectorAll<HTMLElement>("[role='menuitemradio']")].find((i) => i.textContent!.includes("Not connected"))!.click();
    await settle(el);
    const slack = connectOf(el, "Slack");
    slack.focus();
    slack.click();
    await expect.poll(() => connectOf(el, "Slack"), { timeout: 3000 }).toBeUndefined();
    await expect.poll(() => document.activeElement).toBe(connectOf(el, "Notion"));
  });

  test("removed while connecting: no timer fires later", async () => {
    const el = await make();
    let changes = 0;
    el.addEventListener("tc-connected-change", () => changes++);
    connectOf(el, "Slack").click();
    el.remove();
    await new Promise((r) => setTimeout(r, 1200));
    expect(changes).toBe(0);
  });

  test("categories filter the grid; essentials and all are built in", async () => {
    const el = await fixture<TcAppDirectory>(
      html`<tc-app-directory .apps=${[app("a", "Alpha"), app("b", "Beta", { essential: false, categories: ["crm"] })]} .categories=${[
        { id: "essentials", label: "Essentials" },
        { id: "all", label: "All apps" },
        { id: "crm", label: "CRM" },
      ]}></tc-app-directory>`,
    );
    const counts = [...el.querySelectorAll(".ui-adir__nav-count")].map((c) => c.textContent);
    expect(counts).toEqual(["1", "2", "1"]);
    el.querySelector<HTMLButtonElement>("[data-category='crm']")!.click();
    await settle(el);
    expect([...el.querySelectorAll(".ui-adir__name")].map((n) => n.textContent!.trim())).toEqual(["Beta"]);
  });

  test("logos: an image URL is checked; a javascript: one is dropped", async () => {
    const el = await fixture<TcAppDirectory>(
      html`<tc-app-directory .apps=${[app("a", "Alpha", { logo: "data:image/png;base64,iVBORw0KGgo=" }), app("b", "Beta", { logo: "javascript:alert(1)" })]}></tc-app-directory>`,
    );
    const tiles = el.querySelectorAll(".ui-adir__app .ui-adir__tile");
    expect(tiles[0].querySelector("img")).toBeTruthy();
    expect(tiles[1].querySelector("img")).toBeNull();
  });

  test("narrow: categories become a row of chips and the grid one column", async () => {
    const w = await fixture(html`<div style="width: 380px"><tc-app-directory .apps=${APPS}></tc-app-directory></div>`);
    const el = w.querySelector("tc-app-directory")!;
    expect(getComputedStyle(el.querySelector(".ui-adir__nav")!).flexDirection).toBe("row");
    expect(getComputedStyle(el.querySelector(".ui-adir__grid")!).gridTemplateColumns.split(" ")).toHaveLength(1);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React wrapper: uncontrolled connections survive parent re-renders; onConnectedChange and onToggle get the apps", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[][] = [];
    const toggled: string[] = [];
    let bump = () => {};
    const logo = React.createElement("svg", { viewBox: "0 0 10 10", "data-testlogo": "" });
    const apps = [{ ...APPS[0], logo }, APPS[1]];
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(AppDirectory, {
        title: "Tools",
        apps,
        onConnectedChange: (c: string[]) => void seen.push(c),
        onToggle: (a: { id: string; logo?: unknown }) => void toggled.push(`${a.id}:${a.logo === logo}`),
        "data-n": n,
      } as React.ComponentProps<typeof AppDirectory>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-app-directory")!;
    expect(el.querySelector(".ui-adir__title")!.textContent).toBe("Tools");
    await expect.poll(() => el.querySelector(".ui-adir__app [data-testlogo]")).toBeTruthy();
    connectOf(el, "Notion").click();
    await expect.poll(() => stateOf(el, "Notion"), { timeout: 3000 }).toBe("on");
    await act(async () => bump());
    await settle();
    expect(stateOf(el, "Notion")).toBe("on");
    expect(seen).toEqual([["notion"]]);
    expect(toggled).toEqual(["notion:false"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled list follows the prop; a click only reports", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[][] = [];
    const render = (connected: string[]) => root.render(React.createElement(AppDirectory, { apps: APPS, connected, onConnectedChange: (c: string[]) => void asked.push(c) }));
    await act(async () => render(["slack"]));
    await settle();
    const el = host.querySelector("tc-app-directory")!;
    connectOf(el, "Slack").click();
    await settle();
    expect(asked).toEqual([[]]);
    expect(stateOf(el, "Slack")).toBe("on");
    await act(async () => render([]));
    await settle();
    expect(stateOf(el, "Slack")).toBe("off");
    await act(async () => root.unmount());
  });

  test("the block: className and DOM props reach the element, which is its ref", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const ref = React.createRef<HTMLElement>();
    await act(async () => root.render(React.createElement(AppDirectoryBlock, { ref, className: "mine", ...({ "data-x": "1" } as object), apps: APPS as never })));
    await settle();
    const el = host.querySelector("tc-app-directory")!;
    expect(ref.current).toBe(el);
    expect(el.classList.contains("mine") && el.classList.contains("ui-adir")).toBe(true);
    expect(el.getAttribute("data-x")).toBe("1");
    expect(el.querySelectorAll(".ui-adir__app")).toHaveLength(3);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="width: 1100px; padding: 16px; background: var(--tc-surface-base)">
        <tc-app-directory .apps=${APPS} .connected=${["slack"]}></tc-app-directory>
        <tc-app-directory look="clean" heading="Clean directory"></tc-app-directory>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
