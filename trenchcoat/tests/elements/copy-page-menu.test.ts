/*
 * <tc-copy-page-menu> in real browsers: the split button and its menu button, copying (the property, getMarkdown asked
 * once, a failure, a prevented copy), "Copied" on the button and announced, the menu's keys (↓/↑ to open, wrap,
 * Home/End, a letter, Escape and Tab), the items offered with and without a URL, assistants' links (the prompt
 * encoded, unsafe templates dropped, a prevented open), View as Markdown in a modal dialog, Download .md, a click
 * outside, the React wrapper and axe in both looks and both themes, menu open and closed, and with the dialog open.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/copy-page-menu";
import {
  assistantHref,
  markdownFilename,
  type CopyPageAssistant,
  type CopyPageAssistantOpen,
  type CopyPageCopy,
  type CopyPageDownload,
  type TcCopyPageMenu,
} from "../../src/elements/copy-page-menu";
import { CopyPageMenu } from "../../src/elements/react/copy-page-menu";
import { cleanup, finish, fixture, settle } from "./helpers";

const MD = "# List records\n\n`GET /v1/records`\n\nReturns the records you can read.\n";
const URL_ = "https://docs.example.org/records/list";
const ASSISTANTS: CopyPageAssistant[] = [
  { id: "institute", label: "Institute Assistant", urlTemplate: "https://assistant.example.org/new?q={prompt}" },
  { id: "bad", label: "Bad", urlTemplate: "javascript:alert({prompt})" },
];

let written: string[] = [];
let failClipboard = false;
beforeEach(() => {
  written = [];
  failClipboard = false;
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: (t: string) => {
        if (failClipboard) return Promise.reject(new Error("denied"));
        written.push(t);
        return Promise.resolve();
      },
    },
  });
});
afterEach(() => {
  cleanup();
  delete (navigator as { clipboard?: unknown }).clipboard;
});

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const key = (target: Element, k: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const labels = (el: Element) => [...el.querySelectorAll(".ui-cpm__item .ui-cpm__label")].map(text);
const active = () => text((document.activeElement as HTMLElement | null)?.querySelector(".ui-cpm__label"));
const make = (look = "standard") =>
  fixture<TcCopyPageMenu>(html`<tc-copy-page-menu look=${look} url=${URL_} page-title="List records" .markdown=${MD} .assistants=${ASSISTANTS}></tc-copy-page-menu>`);

describe("tc-copy-page-menu", () => {
  test("assistantHref and markdownFilename", () => {
    expect(assistantHref("https://a.example/new?q={prompt}", "Read x & y")).toBe("https://a.example/new?q=Read%20x%20%26%20y");
    expect(assistantHref("javascript:alert({prompt})", "x")).toBeNull();
    expect(markdownFilename("List records – v1 (Café)")).toBe("list-records-v1-cafe.md");
    expect(markdownFilename("")).toBe("page.md");
  });

  for (const look of ["standard", "clean"]) {
    test(`${look}: a Copy page button and a menu button, the menu closed`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("cpm");
      expect(el.dataset.look).toBe(look);
      const main = el.querySelector<HTMLButtonElement>(".ui-cpm__main")!;
      expect(text(main)).toBe("Copy page");
      const more = el.querySelector<HTMLButtonElement>(".ui-cpm__more")!;
      expect(more.getAttribute("aria-haspopup")).toBe("menu");
      expect(more.getAttribute("aria-expanded")).toBe("false");
      expect(text(more)).toBe("More ways to share this page");
      const menu = el.querySelector<HTMLElement>(".ui-cpm__menu")!;
      expect(more.getAttribute("aria-controls")).toBe(menu.id);
      expect(menu.hidden).toBe(true);
    });
  }

  test("Copy page copies the Markdown, says Copied on the button and announces it", async () => {
    const el = await make();
    const seen: CopyPageCopy[] = [];
    el.addEventListener("tc-page-copy", (e) => seen.push((e as CustomEvent<CopyPageCopy>).detail));
    el.querySelector<HTMLButtonElement>(".ui-cpm__main")!.click();
    await expect.poll(() => written).toEqual([MD]);
    expect(seen).toEqual([{ kind: "markdown", text: MD }]);
    await expect.poll(() => text(el.querySelector(".ui-cpm__main"))).toBe("Copied");
    await expect.poll(() => text(el.querySelector("[role=status]"))).toBe("Copied");
  });

  test("a prevented tc-page-copy writes nothing; a refused clipboard says how else to copy", async () => {
    const el = await make();
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-page-copy", stop);
    el.querySelector<HTMLButtonElement>(".ui-cpm__main")!.click();
    await settle(el);
    expect(written).toEqual([]);
    expect(text(el.querySelector(".ui-cpm__main"))).toBe("Copy page");
    el.removeEventListener("tc-page-copy", stop);
    failClipboard = true;
    el.querySelector<HTMLButtonElement>(".ui-cpm__main")!.click();
    await expect.poll(() => text(el.querySelector("[role=status]"))).toBe("Couldn't copy – open View as Markdown and copy the text there");
  });

  test("getMarkdown is asked once and its answer kept; a failure is announced", async () => {
    let calls = 0;
    const get = () => {
      calls++;
      return Promise.resolve("# Made\n");
    };
    const el = await fixture<TcCopyPageMenu>(html`<tc-copy-page-menu .getMarkdown=${get}></tc-copy-page-menu>`);
    el.querySelector<HTMLButtonElement>(".ui-cpm__main")!.click();
    await expect.poll(() => written).toEqual(["# Made\n"]);
    el.querySelector<HTMLButtonElement>(".ui-cpm__main")!.click();
    await expect.poll(() => written).toHaveLength(2);
    expect(calls).toBe(1);
    const broken = await fixture<TcCopyPageMenu>(html`<tc-copy-page-menu .getMarkdown=${() => Promise.reject(new Error("offline"))}></tc-copy-page-menu>`);
    broken.querySelector<HTMLButtonElement>(".ui-cpm__main")!.click();
    await expect.poll(() => text(broken.querySelector("[role=status]"))).toBe("Couldn't get this page's Markdown");
  });

  test("menu keys: ↓ opens on the first item, ↑ on the last; ↓/↑ wrap; Home/End; a letter; Escape returns to the button", async () => {
    const el = await make();
    const more = el.querySelector<HTMLButtonElement>(".ui-cpm__more")!;
    more.focus();
    key(more, "ArrowDown");
    await expect.poll(active).toBe("Copy as Markdown");
    expect(more.getAttribute("aria-expanded")).toBe("true");
    expect(labels(el)).toEqual(["Copy as Markdown", "View as Markdown", "Copy link", "Open in Institute Assistant", "Download .md"]);
    expect([...el.querySelectorAll(".ui-cpm__item")].every((i) => i.getAttribute("role") === "menuitem")).toBe(true);
    key(document.activeElement!, "ArrowUp");
    await expect.poll(active).toBe("Download .md");
    key(document.activeElement!, "ArrowDown");
    await expect.poll(active).toBe("Copy as Markdown");
    key(document.activeElement!, "End");
    await expect.poll(active).toBe("Download .md");
    key(document.activeElement!, "Home");
    await expect.poll(active).toBe("Copy as Markdown");
    key(document.activeElement!, "o");
    await expect.poll(active).toBe("Open in Institute Assistant");
    key(document.activeElement!, "Escape");
    await settle(el);
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(more);
    key(more, "ArrowUp");
    await expect.poll(active).toBe("Download .md");
    key(document.activeElement!, "Tab");
    await settle(el);
    expect(el.open).toBe(false);
  });

  test("without a URL there's no Copy link or assistants; Copy link copies the URL", async () => {
    const bare = await fixture<TcCopyPageMenu>(html`<tc-copy-page-menu hide-download .markdown=${MD} .assistants=${ASSISTANTS} open></tc-copy-page-menu>`);
    expect(labels(bare)).toEqual(["Copy as Markdown", "View as Markdown"]);
    const el = await make();
    el.querySelector<HTMLButtonElement>(".ui-cpm__more")!.click();
    await settle(el);
    [...el.querySelectorAll<HTMLElement>(".ui-cpm__item")].find((i) => text(i).startsWith("Copy link"))!.click();
    await expect.poll(() => written).toEqual([URL_]);
    expect(el.open).toBe(false);
  });

  test("an assistant is a link with the prompt encoded; prevented, it isn't followed", async () => {
    const el = await make();
    el.querySelector<HTMLButtonElement>(".ui-cpm__more")!.click();
    await settle(el);
    const link = el.querySelector<HTMLAnchorElement>("a.ui-cpm__item")!;
    const prompt = `Read ${URL_} and help me with it`;
    expect(link.href).toBe(`https://assistant.example.org/new?q=${encodeURIComponent(prompt)}`);
    expect(link.target).toBe("_blank");
    expect(link.rel).toContain("noopener");
    const seen: CopyPageAssistantOpen[] = [];
    el.addEventListener("tc-assistant-open", (e) => {
      seen.push((e as CustomEvent<CopyPageAssistantOpen>).detail);
      e.preventDefault();
    });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(seen).toEqual([{ id: "institute", href: link.href, prompt }]);
  });

  test("View as Markdown opens a modal dialog with the text; Escape closes it; a prevented view opens nothing", async () => {
    const el = await make();
    el.querySelector<HTMLButtonElement>(".ui-cpm__more")!.click();
    await settle(el);
    [...el.querySelectorAll<HTMLElement>(".ui-cpm__item")].find((i) => text(i).startsWith("View"))!.click();
    const dialog = el.querySelector("dialog")!;
    await expect.poll(() => dialog.open).toBe(true);
    expect(el.querySelector(".ui-cpm__text")!.textContent).toBe(MD);
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)?.textContent).toBe("List records – This page as Markdown");
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-cpm__text"));
    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    await expect.poll(() => dialog.open).toBe(false);
    el.addEventListener("tc-page-view", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-cpm__more")!.click();
    await settle(el);
    [...el.querySelectorAll<HTMLElement>(".ui-cpm__item")].find((i) => text(i).startsWith("View"))!.click();
    await settle(el);
    expect(dialog.open).toBe(false);
  });

  test("Download .md saves a file named from the title; prevented, nothing is saved", async () => {
    const el = await make();
    const seen: CopyPageDownload[] = [];
    el.addEventListener("tc-page-download", (e) => seen.push((e as CustomEvent<CopyPageDownload>).detail));
    const saved: string[] = [];
    const spy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      saved.push(this.download);
    });
    try {
      el.querySelector<HTMLButtonElement>(".ui-cpm__more")!.click();
      await settle(el);
      [...el.querySelectorAll<HTMLElement>(".ui-cpm__item")].find((i) => text(i).startsWith("Download"))!.click();
      await expect.poll(() => saved).toEqual(["list-records.md"]);
      expect(seen).toEqual([{ filename: "list-records.md", markdown: MD }]);
      el.addEventListener("tc-page-download", (e) => e.preventDefault());
      el.querySelector<HTMLButtonElement>(".ui-cpm__more")!.click();
      await settle(el);
      [...el.querySelectorAll<HTMLElement>(".ui-cpm__item")].find((i) => text(i).startsWith("Download"))!.click();
      await expect.poll(() => seen).toHaveLength(2);
      expect(saved).toEqual(["list-records.md"]);
    } finally {
      spy.mockRestore();
    }
  });

  test("a click outside closes the menu; a prevented tc-open-change keeps it as it is", async () => {
    const el = await make();
    el.querySelector<HTMLButtonElement>(".ui-cpm__more")!.click();
    await settle(el);
    expect(el.open).toBe(true);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await settle(el);
    expect(el.open).toBe(false);
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-cpm__more")!.click();
    await settle(el);
    expect(el.open).toBe(false);
  });

  test("React wrapper: uncontrolled open survives re-renders; a controlled one waits for the parent; callbacks can prevent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: boolean[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(
        "div",
        null,
        React.createElement(CopyPageMenu, { id: "free", markdown: MD, "data-n": n, onPageCopy: () => false } as React.ComponentProps<typeof CopyPageMenu>),
        React.createElement(CopyPageMenu, { id: "held", markdown: MD, open: false, "data-n": n, onOpenChange: (o: boolean) => asked.push(o) } as React.ComponentProps<typeof CopyPageMenu>),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const free = host.querySelector<TcCopyPageMenu>("#free")!;
    free.querySelector<HTMLButtonElement>(".ui-cpm__more")!.click();
    await act(async () => bump());
    await settle();
    expect(free.open).toBe(true);
    // onPageCopy returned false: the page copies its own way
    free.querySelector<HTMLButtonElement>(".ui-cpm__main")!.click();
    await settle();
    expect(written).toEqual([]);
    const held = host.querySelector<TcCopyPageMenu>("#held")!;
    held.querySelector<HTMLButtonElement>(".ui-cpm__more")!.click();
    await act(async () => bump());
    await settle();
    expect(asked).toEqual([true]);
    expect(held.open).toBe(false);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, menu closed and open, and the dialog open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="display: flex; gap: 24px; padding: 16px; min-height: 360px; background: var(--tc-surface-base)">
        <tc-copy-page-menu .markdown=${MD}></tc-copy-page-menu>
        <tc-copy-page-menu look="clean" url=${URL_} .markdown=${MD} .assistants=${ASSISTANTS} open></tc-copy-page-menu>
      </div>`);
      await finish(wrap);
      const run = () => axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      const show = (r: axe.AxeResults) => r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      expect(show(await run())).toEqual([]);
      const first = wrap.querySelector<TcCopyPageMenu>("tc-copy-page-menu")!;
      first.querySelector<HTMLButtonElement>(".ui-cpm__more")!.click();
      await settle(wrap);
      [...first.querySelectorAll<HTMLElement>(".ui-cpm__item")].find((i) => text(i).startsWith("View"))!.click();
      await expect.poll(() => first.querySelector("dialog")!.open).toBe(true);
      await finish(wrap);
      expect(show(await run())).toEqual([]);
    });
  }
});
