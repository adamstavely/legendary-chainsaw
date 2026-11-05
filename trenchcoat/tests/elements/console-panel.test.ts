/*
 * <tc-console-panel> in real browsers: rows and marks, counts, level chips, the text filter, Clear, stacks folding, the
 * keyboard, empty states, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/console-panel";
import type { ConsoleEntry, TcConsolePanel } from "../../src/elements/console-panel";
import { ConsolePanel } from "../../src/elements/react/console-panel";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ENTRIES: ConsoleEntry[] = [
  { id: "a", level: "info", message: "Portal 4.12.0", source: "app.js:12" },
  { id: "b", level: "warn", message: "'unload' is deprecated", source: "session.js:31" },
  { id: "c", level: "log", message: "Loaded 24 applications", source: "applications.js:57", count: 3 },
  { id: "d", level: "error", message: "Cannot read properties of undefined", source: "panel.js:142", stack: ["at render (panel.js:142:31)", "at mount (app.js:91:9)"] },
  { id: "e", level: "debug", message: "Router ready" },
];
const make = (look: "standard" | "clean" = "standard", entries: ConsoleEntry[] = ENTRIES) => fixture<TcConsolePanel>(html`<tc-console-panel look=${look} .entries=${entries}></tc-console-panel>`);
const entries = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-dcon__entry")];
const messages = (el: Element) => [...el.querySelectorAll(".ui-dcon__message")].map((m) => m.textContent);
const chip = (el: Element, level: string) => el.querySelector<HTMLElement>(`.ui-dcon__chip[data-level="${level}"]`)!;
const key = async (el: TcConsolePanel, k: string, target: Element = document.activeElement!) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await el.updateComplete;
  await settle(el.parentElement!);
};

describe("tc-console-panel", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: rows in order with level words, counts, sources, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("dcon");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector('[role="tree"]')!.getAttribute("aria-label")).toBe("Console");
      expect(messages(el)).toEqual(["Info: Portal 4.12.0", "Warning: 'unload' is deprecated", "Log: Loaded 24 applications", "Error: Cannot read properties of undefined", "Debug: Router ready"]);
      expect(el.querySelectorAll('.ui-dcon__row[tabindex="0"]')).toHaveLength(1);
      expect(entries(el)[2].querySelector(".ui-dcon__count")!.textContent).toBe("3 times");
      expect(entries(el)[1].querySelector(".ui-dcon__source")!.textContent).toBe("session.js:31");
      expect(entries(el)[3].getAttribute("aria-expanded")).toBe("false");
      expect(entries(el)[0].hasAttribute("aria-expanded")).toBe(false);
      expect([...el.querySelectorAll(".ui-dcon__total")].map((t) => t.textContent!.trim())).toEqual(["1 Errors", "1 Warnings"]);
      await expect.poll(() => el.querySelector('[role="status"]')!.textContent).toBe("5 messages");
    });
  }

  test("level chips count repeats, toggle, and move with arrows; prevented stays", async () => {
    const el = await make();
    expect([...el.querySelectorAll(".ui-dcon__chip")].map((c) => c.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Errors 1", "Warnings 1", "Info 1", "Logs 3", "Debug 1"]);
    expect(el.querySelector('[role="group"]')!.getAttribute("aria-label")).toBe("Levels");
    let detail: unknown = null;
    el.addEventListener("tc-levels-change", (e) => (detail = (e as CustomEvent).detail), { once: true });
    chip(el, "debug").click();
    await el.updateComplete;
    expect(detail).toEqual({ levels: ["error", "warn", "info", "log"], level: "debug" });
    expect(chip(el, "debug").getAttribute("aria-pressed")).toBe("false");
    expect(messages(el)).toHaveLength(4);
    chip(el, "debug").click();
    await el.updateComplete;
    expect(el.levels).toEqual(["error", "warn", "info", "log", "debug"]);
    chip(el, "debug").focus();
    await key(el, "ArrowRight");
    expect(document.activeElement).toBe(chip(el, "error"));
    expect(chip(el, "error").tabIndex).toBe(0);
    el.addEventListener("tc-levels-change", (e) => e.preventDefault());
    chip(el, "error").click();
    await el.updateComplete;
    expect(el.levels).toContain("error");
  });

  test("the text filter matches message and source; Esc clears; nothing matching says so", async () => {
    const el = await make();
    const input = el.querySelector<HTMLInputElement>(".ui-dcon__input")!;
    const type = async (v: string) => {
      input.value = v;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await settle(el.parentElement!);
    };
    await type("SESSION.js");
    expect(messages(el)).toEqual(["Warning: 'unload' is deprecated"]);
    await type("nowhere");
    expect(el.querySelector(".ui-dcon__empty")!.textContent).toBe("No messages match");
    await key(el, "Escape", input);
    expect(el.filter).toBe("");
    expect(messages(el)).toHaveLength(5);
  });

  test("Clear empties the list unless prevented", async () => {
    const el = await make();
    const clear = el.querySelector<HTMLButtonElement>(".ui-dcon__clear")!;
    expect(clear.getAttribute("aria-label")).toBe("Clear console");
    el.addEventListener("tc-clear", (e) => e.preventDefault(), { once: true });
    clear.click();
    await el.updateComplete;
    expect(el.entries).toHaveLength(5);
    clear.click();
    await el.updateComplete;
    expect(el.entries).toHaveLength(0);
    expect(el.querySelector(".ui-dcon__empty")!.textContent).toBe("No messages");
    expect(clear.disabled).toBe(true);
  });

  test("a stack folds open by click; prevented stays shut", async () => {
    const el = await make();
    let detail: unknown = null;
    el.addEventListener("tc-expanded-change", (e) => (detail = (e as CustomEvent).detail), { once: true });
    entries(el)[3].click();
    await el.updateComplete;
    expect(detail).toEqual({ expanded: ["d"], id: "d" });
    expect([...el.querySelectorAll(".ui-dcon__frame")].map((f) => f.textContent!.trim())).toEqual(["at render (panel.js:142:31)", "at mount (app.js:91:9)"]);
    expect(el.querySelector(".ui-dcon__frame")!.getAttribute("aria-level")).toBe("2");
    entries(el)[0].click();
    await el.updateComplete;
    expect(el.expanded).toEqual(["d"]);
    el.addEventListener("tc-expanded-change", (e) => e.preventDefault());
    entries(el)[3].click();
    await el.updateComplete;
    expect(el.expanded).toEqual(["d"]);
  });

  test("keyboard: arrows, into a stack and back, Enter folds, Home / End", async () => {
    const el = await make();
    entries(el)[0].focus();
    await key(el, "ArrowDown");
    await key(el, "ArrowDown");
    await key(el, "ArrowDown");
    expect(document.activeElement).toBe(entries(el)[3]);
    await key(el, "ArrowRight");
    expect(el.expanded).toEqual(["d"]);
    await key(el, "ArrowRight");
    expect(document.activeElement).toBe(el.querySelector(".ui-dcon__frame"));
    await key(el, "ArrowLeft");
    expect(document.activeElement).toBe(entries(el)[3]);
    await key(el, "Enter");
    expect(el.expanded).toEqual([]);
    await key(el, "End");
    expect(document.activeElement).toBe(entries(el)[4]);
    await key(el, "Home");
    expect(document.activeElement).toBe(entries(el)[0]);
  });

  test("times format in the locale; labels rename", async () => {
    const el = await make("standard", [{ id: "t", level: "log", message: "hi", time: new Date(2026, 0, 2, 9, 4, 5, 67).getTime() }]);
    el.locale = "en-GB";
    el.labels = { log: "Logbook", messages: "lines", message: "line" };
    await el.updateComplete;
    expect(el.querySelector(".ui-dcon__time")!.textContent).toBe("09:04:05.067");
    expect(chip(el, "log").textContent).toContain("Logbook");
    await expect.poll(() => el.querySelector('[role="status"]')!.textContent).toBe("1 line");
  });

  test("Clear keeps focus in the panel, and an unparseable time doesn't break the list", async () => {
    const el = await make();
    const clear = el.querySelector<HTMLButtonElement>(".ui-dcon__clear")!;
    clear.focus();
    clear.click();
    await el.updateComplete;
    expect(clear.disabled).toBe(true);
    expect(document.activeElement).toBe(el.querySelector(".ui-dcon__input"));
    el.entries = [{ id: "n", level: "log", message: "no clock", time: NaN }];
    await el.updateComplete;
    expect(el.querySelector(".ui-dcon__row")!.textContent).toContain("no clock");
    expect(el.querySelector(".ui-dcon__time")).toBeNull();
  });

  test("React: Clear sticks when the parent re-renders with the same entries; new messages show", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(ConsolePanel, { entries: ENTRIES })));
    const el = host.querySelector("tc-console-panel") as TcConsolePanel;
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-dcon__clear")!.click());
    expect(el.querySelectorAll(".ui-dcon__row")).toHaveLength(0);
    await act(async () => root.render(React.createElement(ConsolePanel, { entries: ENTRIES, title: "Page console" })));
    await settle(host);
    expect(el.querySelectorAll(".ui-dcon__row")).toHaveLength(0);
    const later = [...ENTRIES, { id: "later", level: "info" as const, message: "after the clear" }];
    await act(async () => root.render(React.createElement(ConsolePanel, { entries: later })));
    await settle(host);
    expect([...el.querySelectorAll(".ui-dcon__row")].map((r) => r.textContent)).toEqual([expect.stringContaining("after the clear")]);
    await act(async () => root.unmount());
  });

  test("React: uncontrolled levels survive re-renders; controlled stay until changed", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(ConsolePanel, { entries: ENTRIES })));
    const el = host.querySelector("tc-console-panel") as TcConsolePanel;
    await act(async () => chip(el, "debug").click());
    await act(async () => root.render(React.createElement(ConsolePanel, { entries: ENTRIES, title: "Page console" })));
    expect(el.levels).toEqual(["error", "warn", "info", "log"]);
    let told: unknown = null;
    await act(async () => root.render(React.createElement(ConsolePanel, { entries: ENTRIES, levels: ["error"], onLevelsChange: (l) => (told = l) })));
    await act(async () => chip(el, "warn").click());
    await settle(host);
    expect(el.levels).toEqual(["error"]);
    expect(told).toEqual(["error", "warn"]);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: ${look} ${theme}`, async () => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        const el = await make(look);
        el.expanded = ["d"];
        await finish(el.parentElement!);
        const r = await axe.run(el);
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        expect(r.violations.map((v) => v.id)).toEqual([]);
      });
});
