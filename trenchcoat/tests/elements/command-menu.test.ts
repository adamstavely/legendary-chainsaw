/*
 * <tc-command-menu> in real browsers – the React component's contract and regression checks (and the command-menu
 * check in high-severity.test.tsx), ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/command-menu";
import type { TcCommandMenu } from "../../src/elements/command-menu";
import { cleanup, fixture, settle } from "./helpers";

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
