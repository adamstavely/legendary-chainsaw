/*
 * <tc-command-menu> in real browsers – the React component's contract and regression checks (and the command-menu
 * check in high-severity.test.tsx), ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/command-menu";
import type { TcCommandMenu } from "../../src/elements/command-menu";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const combobox = (el: Element) => el.querySelector<HTMLInputElement>('[role="combobox"]')!;
const key = (target: Element, init: KeyboardEventInit) => target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }));
const press = (init: KeyboardEventInit) => {
  const e = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(e);
  return e;
};
const type = async (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
const css = () => (customElements.get("tc-command-menu") as unknown as { css: string }).css;

describe("tc-command-menu", () => {
  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("the host is the root; the combobox points at its listbox and the active row", async () => {
        const el = await fixture<TcCommandMenu>(html`<tc-command-menu look=${look}></tc-command-menu>`);
        expect(el.dataset.ui).toBe("cm");
        expect(el.dataset.look).toBe(look);
        const input = combobox(el);
        expect(document.getElementById(input.getAttribute("aria-controls")!)!.getAttribute("role")).toBe("listbox");
        const active = document.getElementById(input.getAttribute("aria-activedescendant")!)!;
        expect(active.getAttribute("aria-selected")).toBe("true");
        expect(active.textContent).toContain("Write an email");
        // The footer sits in the panel in Clean, under it in Standard
        expect(!!el.querySelector(".ui-cm__card > footer")).toBe(look === "clean");
      });

      test("Tab and Shift+Tab are left to the browser and don't move the active row (2.1.2)", async () => {
        const el = await fixture<TcCommandMenu>(html`<tc-command-menu look=${look}></tc-command-menu>`);
        const input = combobox(el);
        const active = input.getAttribute("aria-activedescendant");
        expect(key(input, { key: "Tab" })).toBe(true);
        expect(key(input, { key: "Tab", shiftKey: true })).toBe(true);
        await settle();
        expect(input.getAttribute("aria-activedescendant")).toBe(active);
        expect(el.textContent).not.toMatch(/jump between sections/);
      });

      test("arrow keys move the active row and wrap; Enter runs it", async () => {
        const onRun = vi.fn();
        const el = await fixture<TcCommandMenu>(html`<tc-command-menu look=${look} .onRun=${onRun}></tc-command-menu>`);
        const input = combobox(el);
        key(input, { key: "ArrowDown" });
        await settle();
        expect(document.getElementById(input.getAttribute("aria-activedescendant")!)!.dataset.id).toBe("ask");
        key(input, { key: "ArrowUp" });
        key(input, { key: "ArrowUp" });
        await settle();
        expect(document.getElementById(input.getAttribute("aria-activedescendant")!)!.dataset.id).toBe("help");
        key(input, { key: "Enter" });
        expect(onRun).toHaveBeenCalledWith("help", undefined, expect.objectContaining({ signal: expect.any(AbortSignal) }));
        key(input, { key: "2", ctrlKey: true });
        expect(onRun).toHaveBeenLastCalledWith("ask", undefined, expect.anything());
      });

      test("⌘K focuses the field with one window listener for several menus; hotkey false leaves it alone", async () => {
        const add = vi.spyOn(window, "addEventListener");
        const wrap = await fixture(html`<div><tc-command-menu look=${look}></tc-command-menu><tc-command-menu look=${look}></tc-command-menu></div>`);
        expect(add.mock.calls.filter(([t]) => t === "keydown")).toHaveLength(1);
        add.mockRestore();
        const [, second] = wrap.querySelectorAll<HTMLInputElement>('[role="combobox"]');
        expect(press({ key: "k", metaKey: true }).defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(second);
        cleanup();

        const el = await fixture<TcCommandMenu>(html`<tc-command-menu look=${look} .hotkey=${false}></tc-command-menu>`);
        (document.activeElement as HTMLElement | null)?.blur();
        expect(press({ key: "k", ctrlKey: true }).defaultPrevented).toBe(false);
        expect(document.activeElement).not.toBe(combobox(el));
        expect(el.textContent).not.toContain("to open");
      });

      test("a custom hotkey is shown and used", async () => {
        const el = await fixture<TcCommandMenu>(html`<tc-command-menu look=${look} .hotkey=${"ctrl+shift+p"}></tc-command-menu>`);
        expect(press({ key: "k", ctrlKey: true }).defaultPrevented).toBe(false);
        expect(press({ key: "P", ctrlKey: true, shiftKey: true }).defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(combobox(el));
        expect([...el.querySelectorAll(".ui-cm__foot-right kbd")].map((k) => k.textContent)).toEqual(["Ctrl", "⇧", "P"]);
      });

      test("Enter while an IME is composing does not run", async () => {
        const onRun = vi.fn();
        const el = await fixture<TcCommandMenu>(html`<tc-command-menu look=${look} .onRun=${onRun}></tc-command-menu>`);
        const input = combobox(el);
        key(input, { key: "Enter", isComposing: true });
        expect(onRun).not.toHaveBeenCalled();
        key(input, { key: "Enter" });
        expect(onRun).toHaveBeenCalledWith("email", undefined, expect.objectContaining({ signal: expect.any(AbortSignal) }));
      });

      test("an async run shows pending, then an error it recovers from, and aborts on disconnect", async () => {
        let reject!: () => void;
        let signal!: AbortSignal;
        const onRun = vi
          .fn()
          .mockImplementationOnce(() => new Promise((_, r) => (reject = () => r(new Error("x")))))
          .mockImplementationOnce((_id: string, _q: string | undefined, o: { signal: AbortSignal }) => ((signal = o.signal), new Promise(() => {})));
        const el = await fixture<TcCommandMenu>(html`<tc-command-menu look=${look} .onRun=${onRun}></tc-command-menu>`);
        const input = combobox(el);
        key(input, { key: "Enter" });
        await settle();
        expect(el.querySelector('[data-state="pending"]')).toBeTruthy();
        expect(el.getAttribute("aria-busy")).toBe("true");
        key(input, { key: "Enter" });
        expect(onRun).toHaveBeenCalledTimes(1);
        reject();
        await settle();
        expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/Couldn't run/);
        key(input, { key: "Enter" });
        expect(onRun).toHaveBeenCalledTimes(2);
        el.remove();
        expect(signal.aborted).toBe(true);
        // The pending update after the disconnect doesn't bind the hotkey again
        await settle();
        expect((globalThis as unknown as Record<symbol, Map<string, unknown>>)[Symbol.for("trenchcoat.hotkeys")].has("mod+k")).toBe(false);
      });

      test("the assistant tile's gradient ids are unique per instance", async () => {
        const wrap = await fixture(html`<div><tc-command-menu look=${look}></tc-command-menu><tc-command-menu look=${look}></tc-command-menu></div>`);
        const ids = [...wrap.querySelectorAll("linearGradient")].map((g) => g.id);
        expect(ids.length).toBeGreaterThan(0);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).not.toContain("ui-cm-spark");
        // Every url(#…) points at a gradient in the same logo
        for (const path of wrap.querySelectorAll<SVGElement>('[fill^="url(#"]')) {
          const id = path.getAttribute("fill")!.slice(5, -1);
          expect(path.closest("svg")!.querySelector(`#${CSS.escape(id)}`)).toBeTruthy();
        }
      });

      test("status and alert regions are there from the start; the footer is not a live region (4.1.3)", async () => {
        const el = await fixture<TcCommandMenu>(html`<tc-command-menu look=${look}></tc-command-menu>`);
        expect(el.querySelector('[role="status"]')!.textContent).toBe("");
        expect(el.querySelector('[role="alert"]')!.textContent).toBe("");
        expect(el.querySelector("footer")!.hasAttribute("aria-live")).toBe(false);
        expect(el.querySelectorAll("[aria-live]")).toHaveLength(0);
      });

      test("a finished run is announced once in the status region, and a repeat is announced again", async () => {
        const el = await fixture<TcCommandMenu>(html`<tc-command-menu look=${look}></tc-command-menu>`);
        const input = combobox(el);
        key(input, { key: "Enter" });
        await settle();
        const status = el.querySelector('[role="status"]')!;
        const first = status.textContent;
        expect(first?.trim()).toBe("Ran “Write an email”");
        key(input, { key: "Enter" });
        await settle();
        const second = el.querySelector('[role="status"]')!.textContent;
        expect(second?.trim()).toBe(first?.trim());
        expect(second).not.toBe(first);
        expect(el.querySelector(".ui-cm__done-text")!.textContent).toBe("Write an email");
      });

      test("typing filters, highlights, offers the assistant first; Esc clears, then closes", async () => {
        const onRun = vi.fn();
        const onClose = vi.fn();
        const el = await fixture<TcCommandMenu>(html`<tc-command-menu look=${look} .onRun=${onRun} @tc-close=${onClose}></tc-command-menu>`);
        const input = combobox(el);
        const changes: string[] = [];
        el.addEventListener("tc-query-change", (e) => changes.push((e as CustomEvent<{ query: string }>).detail.query));
        await type(input, "mail");
        expect(el.query).toBe("mail");
        const rows = [...el.querySelectorAll('[role="option"]')];
        expect(rows[0].textContent).toContain("Ask assistant about “mail”");
        expect(rows[1].querySelector("mark")!.textContent).toBe("mail");
        key(input, { key: "Enter" });
        expect(onRun).toHaveBeenCalledWith("ask", "mail", expect.anything());
        key(input, { key: "Escape" });
        await settle();
        expect(input.value).toBe("");
        expect(onClose).not.toHaveBeenCalled();
        key(input, { key: "Escape" });
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(changes).toEqual(["mail", ""]);
      });

      test("controlled: preventDefault keeps the query, the app passes it back", async () => {
        const el = await fixture<TcCommandMenu>(html`<tc-command-menu look=${look} query="mail"></tc-command-menu>`);
        const input = combobox(el);
        expect(input.value).toBe("mail");
        el.addEventListener("tc-query-change", (e) => e.preventDefault());
        await type(input, "mailx");
        expect(el.query).toBe("mail");
        expect(input.value).toBe("mail");
        el.query = "home";
        await settle();
        expect(input.value).toBe("home");
      });

      test("very long lists render at most maxRows rows and say so", async () => {
        const groups = [{ id: "all", label: "All", commands: Array.from({ length: 500 }, (_, i) => ({ id: `c${i}`, label: `Command ${i}` })) }];
        const el = await fixture<TcCommandMenu>(html`<tc-command-menu look=${look} .groups=${groups} .maxRows=${50}></tc-command-menu>`);
        expect(el.querySelectorAll('[role="option"]')).toHaveLength(50);
        expect(el.textContent).toMatch(/Showing 50 of 500/);
        await type(combobox(el), "Command 49");
        expect(el.textContent).not.toMatch(/Showing/);
      });
    });
  }

  test("styles: a focus ring on the panel, a ≥3:1 edge on the active row, hints stay at narrow widths", () => {
    const sheet = css();
    expect(sheet).toMatch(/\.ui-cm__card:has\(input:focus-visible\)\s*\{\s*outline: var\(--tc-focus-outline/);
    expect(sheet).not.toMatch(/input:focus-visible\s*\{\s*outline:\s*none/);
    expect(sheet).toMatch(/\[data-ui="cm"\]:has\(input:focus\) \.ui-cm__pill \{ opacity: 1; box-shadow: inset 0 0 0 1px var\(--tc-border-selected/);
    const narrow = sheet.split("@container (max-width: 480px)")[1]?.split("@media")[0] ?? "";
    expect(narrow).not.toContain("ui-cm__hint");
  });

  test("a custom logo is cloned, not moved; autofocus focuses the field", async () => {
    const logo = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    logo.setAttribute("data-mine", "");
    const groups = [{ id: "g", label: "G", commands: [{ id: "x", label: "X", logo }] }];
    const el = await fixture<TcCommandMenu>(html`<tc-command-menu autofocus .groups=${groups}></tc-command-menu>`);
    expect(el.querySelector(".ui-cm__logo svg[data-mine]")).toBeTruthy();
    expect(logo.isConnected).toBe(false);
    expect(document.activeElement).toBe(combobox(el));
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-command-menu .hotkey=${false}></tc-command-menu>
      <tc-command-menu look="clean" .hotkey=${false}></tc-command-menu>
    </div>`);
    wrap.getAnimations({ subtree: true }).forEach((a) => a.finish());
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

// An app header's ⌘K search over results from a server: popover layout, server filtering, loading and empty states
describe("tc-command-menu as a header search", () => {
  const RESULTS = [
    { id: "topics", label: "Topics", commands: [{ id: "topic:t-neuro", label: "Neuromorphic Computing", hint: "P1 · at risk" }, { id: "topic:t-edge", label: "Edge AI for Sensing" }] },
    { id: "people", label: "People", commands: [{ id: "person:p-okonkwo", label: "Marcus Okonkwo", hint: "Cognitive Systems" }] },
  ];
  const labels = (el: Element) => [...el.querySelectorAll(".ui-cm__item .ui-cm__name")].map((n) => n.textContent);
  const status = (el: Element) => el.querySelector('[role="status"]')!.textContent!.trim();
  const make = (extra = "") => fixture<TcCommandMenu>(html`<div style="width: 320px; margin: 40px"><tc-command-menu layout="popover" filter="none" assistant="false" placeholder="Search topics, gaps, papers, people…" .groups=${RESULTS}></tc-command-menu></div>${extra}`).then((w) => w.querySelector("tc-command-menu")!);
  const pop = (el: Element) => el.querySelector<HTMLElement>(".ui-cm__pop");

  test("assistant=\"false\" leaves out the ask row; a match-less search shows the empty text instead", async () => {
    const el = await fixture<TcCommandMenu>(html`<tc-command-menu assistant="false" empty-text="Nothing matches “{query}”"></tc-command-menu>`);
    expect(el.assistant).toBe(false);
    await type(combobox(el), "zzz");
    expect(el.querySelector('[data-id="ask-about"]')).toBeNull();
    expect(el.textContent).not.toContain("Ask assistant about");
    expect(el.querySelector('.ui-cm__state[data-state="empty"]')!.textContent).toBe("Nothing matches “zzz”");
    expect(el.querySelector<HTMLElement>('[role="listbox"]')!.hidden).toBe(true);
    // The default still offers it
    const other = await fixture<TcCommandMenu>(html`<tc-command-menu></tc-command-menu>`);
    await type(combobox(other), "zzz");
    expect(other.querySelector('[data-id="ask-about"]')).not.toBeNull();
  });

  test("filter=\"none\" shows the groups exactly as given, whatever is typed; matches are still highlighted", async () => {
    const el = await make();
    await type(combobox(el), "neur");
    expect(labels(el)).toEqual(["Neuromorphic Computing", "Edge AI for Sensing", "Marcus Okonkwo"]);
    expect(el.querySelector(".ui-cm__name mark")!.textContent).toBe("Neur");
    el.groups = [{ id: "topics", label: "Topics", commands: [RESULTS[0].commands[0]] }];
    await settle();
    expect(labels(el)).toEqual(["Neuromorphic Computing"]);
  });

  test("popover: a compact field; focus opens the results under it; Esc closes and keeps the text; outside click closes", async () => {
    const el = await make();
    const field = el.querySelector<HTMLElement>(".ui-cm__search")!;
    expect(field.getBoundingClientRect().height).toBeCloseTo(parseFloat(getComputedStyle(field).height), 0);
    expect(field.getBoundingClientRect().height).toBeLessThanOrEqual(32);
    expect(el.querySelector(".ui-cm__foot")).toBeNull();
    expect(pop(el)).toBeNull();
    const input = combobox(el);
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
    expect(input.placeholder).toBe("Search topics, gaps, papers, people…");
    input.focus();
    await settle();
    await expect.poll(() => pop(el)?.hasAttribute("data-placed")).toBe(true);
    await finish(pop(el)!);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    const box = pop(el)!.getBoundingClientRect();
    expect(box.top).toBeGreaterThanOrEqual(field.getBoundingClientRect().bottom);
    expect(Math.abs(box.left - field.getBoundingClientRect().left), "left edges").toBeLessThanOrEqual(1);
    expect(box.width).toBeGreaterThanOrEqual(field.getBoundingClientRect().width - 1);
    // The listbox lives in the popover; the field owns it and points at the active option
    const list = pop(el)!.querySelector('[role="listbox"]')!;
    expect(input.getAttribute("aria-controls")).toBe(list.id);
    expect(input.getAttribute("aria-activedescendant")).toBe(list.querySelector('[role="option"]')!.id);

    await type(input, "neur");
    key(input, { key: "Escape" });
    await settle();
    expect(pop(el)).toBeNull();
    expect(input.value).toBe("neur");
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    // ↓ opens it again; then a pointer-down outside closes it
    key(input, { key: "ArrowDown" });
    await settle();
    expect(pop(el)).not.toBeNull();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(pop(el)).toBeNull();
    expect(input.value).toBe("neur");
  });

  test("popover: ↓ moves, Enter runs the active row and closes; a click runs one too", async () => {
    const el = await make();
    const ran: string[] = [];
    el.onRun = (id) => void ran.push(id);
    const input = combobox(el);
    input.focus();
    await type(input, "m");
    key(input, { key: "ArrowDown" });
    key(input, { key: "ArrowDown" });
    await settle();
    expect(input.getAttribute("aria-activedescendant")).toBe(el.querySelector('[data-id="person:p-okonkwo"]')!.id);
    key(input, { key: "Enter" });
    await settle();
    expect(ran).toEqual(["person:p-okonkwo"]);
    expect(pop(el)).toBeNull();
    // Enter in a closed popover doesn't run anything
    key(input, { key: "Enter" });
    expect(ran).toHaveLength(1);
    input.focus();
    key(input, { key: "ArrowDown" });
    await settle();
    el.querySelector<HTMLButtonElement>('[data-id="topic:t-edge"]')!.click();
    await settle();
    expect(ran).toEqual(["person:p-okonkwo", "topic:t-edge"]);
    expect(pop(el)).toBeNull();
  });

  test("⌘K / Ctrl K focuses the field and opens the results", async () => {
    const el = await make();
    press({ key: "k", metaKey: true, ctrlKey: true });
    await settle();
    expect(document.activeElement).toBe(combobox(el));
    await expect.poll(() => !!pop(el)).toBe(true);
    // The hint shows in the empty field
    expect(el.querySelector(".ui-cm__hotkey")!.textContent).toMatch(/K/);
  });

  test("loading shows and announces “Searching…”; the results that come back are announced as a count, or the empty text", async () => {
    const el = await make();
    el.groups = [];
    await settle();
    const input = combobox(el);
    input.focus();
    await type(input, "neu");
    el.loading = true;
    await settle();
    expect(pop(el)!.querySelector('.ui-cm__state[data-state="loading"]')!.textContent).toBe("Searching…");
    expect(status(el)).toBe("Searching…");
    expect(input.getAttribute("aria-busy")).toBe("true");
    el.groups = RESULTS;
    el.loading = false;
    await settle();
    expect(pop(el)!.querySelector(".ui-cm__state")).toBeNull();
    expect(status(el)).toBe("3 results");
    expect(input.hasAttribute("aria-busy")).toBe(false);
    el.groups = [];
    await settle();
    expect(pop(el)!.querySelector('.ui-cm__state[data-state="empty"]')!.textContent).toBe("Nothing matches “neu”");
    expect(status(el)).toBe("Nothing matches “neu”");
    el.emptyText = "No topics, gaps, papers or people match “{query}”";
    await type(input, "xyz");
    expect(status(el)).toBe("No topics, gaps, papers or people match “xyz”");
  });

  test("inverse: the field takes the dark theme's colours on a light page; the popover keeps the light theme", async () => {
    const wrap = await fixture(html`<div data-tc-theme="light" style="width: 400px; background: #081d35">
      <span class="probe" data-tc-theme="dark" style="color: var(--tc-text-muted)"></span>
      <tc-command-menu layout="popover" filter="none" assistant="false" inverse .groups=${RESULTS}></tc-command-menu>
    </div>`);
    const el = wrap.querySelector("tc-command-menu")!;
    expect(el.hasAttribute("inverse")).toBe(true);
    const field = el.querySelector(".ui-cm__search")!;
    expect(getComputedStyle(field).colorScheme).toBe("dark");
    expect(getComputedStyle(field).color).toBe(getComputedStyle(wrap.querySelector(".probe")!).color);
    combobox(el).focus();
    await expect.poll(() => !!pop(el)).toBe(true);
    expect(getComputedStyle(pop(el)!).colorScheme).toBe("light");
  });

  test("axe: the popover field open and closed, with results, loading and empty", async () => {
    const el = await make();
    const run = async () => {
      const result = await axe.run(el.parentElement!.parentElement!, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ") + " " + n.failureSummary).join(", ")}`);
    };
    expect((await run()).join("\n")).toBe("");
    combobox(el).focus();
    await type(combobox(el), "ne");
    await expect.poll(() => pop(el)?.hasAttribute("data-placed")).toBe(true);
    await finish(pop(el)!);
    expect((await run()).join("\n")).toBe("");
    el.loading = true;
    await settle();
    await finish(pop(el)!);
    expect((await run()).join("\n")).toBe("");
    el.loading = false;
    el.groups = [];
    await settle();
    await finish(pop(el)!);
    expect((await run()).join("\n")).toBe("");
  });
});
