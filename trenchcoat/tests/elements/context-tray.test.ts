/*
 * <tc-context-tray> in real browsers: chips, weights and the total against the window; remove (cancelable, undoable,
 * focus moved sensibly), pin; the toolbar keyboard; controlled use; the wrapper; axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/context-tray";
import type { ContextTrayItem, ContextTrayItemsChange, TcContextTray } from "../../src/elements/context-tray";
import { ContextTray, type ContextTrayEntry } from "../../src/elements/react/context-tray";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const items = (): ContextTrayItem[] => [
  { id: "spec", label: "billing-spec.md", kind: "file", tokens: 18600, pinned: true, hint: "docs/billing-spec.md" },
  { id: "priya", label: "@Priya Shah", kind: "mention", tokens: 1200 },
  { id: "stripe", label: "Stripe API reference", kind: "source", tokens: 34800 },
];

const tray = (look: "standard" | "clean", extra: Partial<TcContextTray> = {}) =>
  fixture<TcContextTray>(html`<tc-context-tray look=${look} limit="200000" reserved="46000" .items=${extra.items ?? items()} .undoTimeout=${extra.undoTimeout ?? 6000}></tc-context-tray>`);
const chips = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-ctt__chip:not([data-leaving])")];
const labels = (el: Element) => chips(el).map((c) => c.querySelector(".ui-ctt__label")!.textContent);
const press = (target: Element, init: KeyboardEventInit) => {
  const e = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(e);
  return e;
};
/** Waits out the fold of a removed chip */
const folded = async () => {
  await new Promise((r) => setTimeout(r, 320));
  await settle();
};

describe("tc-context-tray", () => {
  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("the host is a named group: chips with weights, the total against the window, the meter", async () => {
        const el = await tray(look);
        expect(el.dataset.ui).toBe("ctt");
        expect(el.dataset.look).toBe(look);
        expect(el.getAttribute("role")).toBe("group");
        expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("In context");
        expect(labels(el)).toEqual(["billing-spec.md", "@Priya Shah", "Stripe API reference"]);
        expect(chips(el).map((c) => c.querySelector(".ui-ctt__weight")!.textContent)).toEqual(["18.6K", "1.2K", "34.8K"]);
        expect(chips(el)[0].getAttribute("aria-label")).toBe("billing-spec.md, 18.6K tokens, pinned");
        expect(chips(el)[0].title).toBe("docs/billing-spec.md");
        expect(el.used).toBe(100600);
        expect(el.querySelector(".ui-ctt__used")!.textContent).toBe("100.6K");
        expect(el.querySelector(".ui-ctt__total .ui-ctt__sr")!.textContent).toContain("100.6K of 200K tokens used, 50 percent, 3 items");
        expect(el.querySelector(".ui-ctt__caption")!.textContent!.trim()).toBe("99.4K free of 200K");
        // Reserved first, then one segment per chip, sized against the window
        const segs = [...el.querySelectorAll<HTMLElement>(".ui-ctt__seg")];
        expect(segs.map((s) => s.dataset.kind)).toEqual(["reserved", "file", "mention", "source"]);
        expect(segs[0].style.width).toBe("23%");
        // The caption sits in the card's last row in Clean, on the tray in Standard
        expect(!!el.querySelector(".ui-ctt__card > .ui-ctt__foot")).toBe(look === "clean");
      });

      test("warns from warn-at, and says when it's over the window", async () => {
        const el = await tray(look);
        el.reserved = 120000;
        await settle();
        expect(el.dataset.level).toBe("warn");
        expect(el.querySelector('.ui-ctt__line[data-tone="warn"]')!.textContent).toContain("Only 25.4K left");
        expect(el.querySelector('[role="status"]')!.textContent!.trim()).toBe("Context window is almost full");
        el.reserved = 160000;
        await settle();
        expect(el.dataset.level).toBe("over");
        expect(el.querySelector('.ui-ctt__line[data-tone="danger"]')!.textContent).toContain("14.6K over the window");
        // Over the window the segments share the total instead
        const widths = [...el.querySelectorAll<HTMLElement>(".ui-ctt__seg")].reduce((n, s) => n + parseFloat(s.style.width), 0);
        expect(Math.round(widths)).toBe(100);
      });

      test("× removes: a cancelable change, the chip folds, focus moves to the next chip's ×; Undo puts it back", async () => {
        const el = await tray(look);
        const changes: ContextTrayItemsChange[] = [];
        el.addEventListener("tc-items-change", (e) => changes.push((e as CustomEvent<ContextTrayItemsChange>).detail));
        const x = chips(el)[1].querySelector<HTMLButtonElement>(".ui-ctt__remove")!;
        x.focus();
        x.click();
        await settle();
        expect(changes[0].change).toMatchObject({ type: "remove", item: { id: "priya" } });
        expect(changes[0].items.map((i) => i.id)).toEqual(["spec", "stripe"]);
        expect(document.activeElement).toBe(chips(el)[1].querySelector(".ui-ctt__remove"));
        expect(chips(el)[1].dataset.id).toBe("stripe");
        expect(el.querySelector('[role="status"]')!.textContent).toContain("Removed @Priya Shah");
        expect(el.querySelector(".ui-ctt__caption")!.textContent).toContain("Removed @Priya Shah");
        await folded();
        expect(el.querySelectorAll(".ui-ctt__chip")).toHaveLength(2);
        el.querySelector<HTMLButtonElement>(".ui-ctt__undo")!.click();
        await settle();
        expect(changes[1].change).toMatchObject({ type: "restore", item: { id: "priya" } });
        expect(labels(el)).toEqual(["billing-spec.md", "@Priya Shah", "Stripe API reference"]);
        expect(el.querySelector(".ui-ctt__undo")).toBeNull();
      });

      test("Delete in the toolbar removes; removing the last chip hands focus to Undo; ⌘Z / Ctrl Z undoes", async () => {
        const el = await tray(look, { items: [{ id: "only", label: "notes.md", tokens: 900 }] });
        const pin = el.querySelector<HTMLButtonElement>(".ui-ctt__pin")!;
        pin.focus();
        expect(press(pin, { key: "Delete" }).defaultPrevented).toBe(true);
        await settle();
        expect(el.items).toEqual([]);
        expect(document.activeElement).toBe(el.querySelector(".ui-ctt__undo"));
        await folded();
        expect(el.querySelector(".ui-ctt__empty")!.textContent).toContain("Nothing in context yet");
        expect(press(document.activeElement!, { key: "z", ctrlKey: true }).defaultPrevented).toBe(true);
        await settle();
        expect(labels(el)).toEqual(["notes.md"]);
        // Undo took the focus back to the chip that returned
        expect(document.activeElement).toBe(el.querySelector(".ui-ctt__remove"));
        expect(press(el.querySelector(".ui-ctt__remove")!, { key: "z", metaKey: true }).defaultPrevented).toBe(false);
      });

      test("controlled: preventDefault keeps the items; the app passes them back", async () => {
        const el = await tray(look);
        el.addEventListener("tc-items-change", (e) => e.preventDefault());
        chips(el)[2].querySelector<HTMLButtonElement>(".ui-ctt__remove")!.click();
        chips(el)[1].querySelector<HTMLButtonElement>(".ui-ctt__pin")!.click();
        await settle();
        expect(labels(el)).toHaveLength(3);
        expect(el.querySelector(".ui-ctt__undo")).toBeNull();
        expect(chips(el)[1].hasAttribute("data-pinned")).toBe(false);
        el.items = items().slice(0, 1);
        await settle();
        expect(labels(el)).toEqual(["billing-spec.md"]);
        await folded();
        expect(el.querySelectorAll(".ui-ctt__chip")).toHaveLength(1);
      });

      test("pin toggles with aria-pressed; it's announced and the chip is marked", async () => {
        const el = await tray(look);
        const changes: ContextTrayItemsChange[] = [];
        el.addEventListener("tc-items-change", (e) => changes.push((e as CustomEvent<ContextTrayItemsChange>).detail));
        const pin = chips(el)[1].querySelector<HTMLButtonElement>(".ui-ctt__pin")!;
        expect(pin.getAttribute("aria-pressed")).toBe("false");
        expect(pin.getAttribute("aria-label")).toBe("Pin @Priya Shah");
        pin.click();
        await settle();
        expect(changes[0].change).toMatchObject({ type: "pin", item: { id: "priya", pinned: true } });
        expect(pin.getAttribute("aria-pressed")).toBe("true");
        expect(chips(el)[1].hasAttribute("data-pinned")).toBe(true);
        expect(el.querySelector('[role="status"]')!.textContent).toContain("Pinned @Priya Shah");
        pin.click();
        await settle();
        expect(changes[1].change.type).toBe("unpin");
        expect(el.items[1].pinned).toBe(false);
      });

      test("the chips are one toolbar: one tab stop, ← → Home End move between buttons", async () => {
        const el = await tray(look);
        const toolbar = el.querySelector('[role="toolbar"]')!;
        expect(toolbar.getAttribute("aria-label")).toBe("In context: 3 items");
        const buttons = [...toolbar.querySelectorAll<HTMLButtonElement>("button")];
        expect(buttons.filter((b) => b.tabIndex === 0)).toEqual([buttons[0]]);
        buttons[0].focus();
        press(buttons[0], { key: "ArrowRight" });
        expect(document.activeElement).toBe(buttons[1]);
        press(buttons[1], { key: "ArrowRight" });
        expect(document.activeElement).toBe(buttons[2]);
        press(buttons[2], { key: "End" });
        expect(document.activeElement).toBe(buttons[5]);
        press(buttons[5], { key: "ArrowRight" });
        expect(document.activeElement).toBe(buttons[5]);
        press(buttons[5], { key: "Home" });
        expect(document.activeElement).toBe(buttons[0]);
        press(buttons[0], { key: "ArrowLeft" });
        expect(document.activeElement).toBe(buttons[0]);
        press(buttons[0], { key: "End" });
        await settle();
        // The tab stop follows
        expect([...toolbar.querySelectorAll<HTMLButtonElement>("button")].filter((b) => b.tabIndex === 0)).toEqual([buttons[5]]);
      });

      test("removing the first chip by its pin button's Backspace moves to the next chip's pin", async () => {
        const el = await tray(look);
        const pin = chips(el)[0].querySelector<HTMLButtonElement>(".ui-ctt__pin")!;
        pin.focus();
        press(pin, { key: "Backspace" });
        await settle();
        expect(document.activeElement).toBe(chips(el)[0].querySelector(".ui-ctt__pin"));
        expect(chips(el)[0].dataset.id).toBe("priya");
      });

      test("Undo goes after undo-timeout; undo-timeout 0 means no Undo", async () => {
        const el = await tray(look, { undoTimeout: 120 });
        chips(el)[0].querySelector<HTMLButtonElement>(".ui-ctt__remove")!.click();
        await settle();
        expect(el.querySelector(".ui-ctt__undo")).toBeTruthy();
        await new Promise((r) => setTimeout(r, 200));
        await settle();
        expect(el.querySelector(".ui-ctt__undo")).toBeNull();
        expect(el.undo()).toBe(false);
        el.undoTimeout = 0;
        chips(el)[0].querySelector<HTMLButtonElement>(".ui-ctt__remove")!.click();
        await settle();
        expect(el.querySelector(".ui-ctt__undo")).toBeNull();
        expect(el.querySelector('[role="status"]')!.textContent).toContain("Removed @Priya Shah");
      });

      test("hovering a chip lights its meter segment; a custom icon is cloned", async () => {
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("data-mine", "");
        const el = await tray(look, { items: [...items(), { id: "x", label: "x.csv", tokens: 400, kind: "table", icon }] });
        expect(el.querySelector(".ui-ctt__kind svg[data-mine]")).toBeTruthy();
        expect(icon.isConnected).toBe(false);
        expect(chips(el)[3].dataset.kind).toBe("other");
        chips(el)[2].dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
        await settle();
        expect(el.querySelector(".ui-ctt__meter")!.hasAttribute("data-hot")).toBe(true);
        expect(el.querySelector('.ui-ctt__seg[data-on]')!.getAttribute("data-kind")).toBe("source");
      });
    });
  }

  test("timers are cleared on disconnect", async () => {
    const clear = vi.spyOn(window, "clearTimeout");
    const el = await tray("standard");
    chips(el)[0].querySelector<HTMLButtonElement>(".ui-ctt__remove")!.click();
    await settle();
    clear.mockClear();
    el.remove();
    expect(clear.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  test("React wrapper: uncontrolled items survive a parent re-render; onChange fires; node icons; Undo restores the entry", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    const start: ContextTrayEntry[] = [
      { id: "a", label: "a.md", tokens: 1000, icon: React.createElement("svg", { "data-node": "" }) },
      { id: "b", label: "b.md", tokens: 2000 },
    ];
    function App() {
      const [n, setN] = React.useState(0);
      return React.createElement(
        "div",
        null,
        React.createElement("button", { id: "rerender", onClick: () => setN(n + 1) }, `re-render ${n}`),
        React.createElement(ContextTray, { defaultItems: start, limit: 10000, onChange, title: "Attached" }),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcContextTray>("tc-context-tray")!;
    expect(el.heading).toBe("Attached");
    expect(el.querySelector(".ui-ctt__kind svg[data-node]")).toBeTruthy();
    await act(async () => chips(el)[0].querySelector<HTMLButtonElement>(".ui-ctt__remove")!.click());
    await settle();
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ id: "b" })], expect.objectContaining({ type: "remove" }));
    await act(async () => host.querySelector<HTMLButtonElement>("#rerender")!.click());
    await settle();
    expect(labels(el)).toEqual(["b.md"]);
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-ctt__undo")!.click());
    await settle();
    expect(labels(el)).toEqual(["a.md", "b.md"]);
    expect(onChange.mock.calls[1][0][0].icon).toEqual(start[0].icon);
    expect(el.querySelector(".ui-ctt__kind svg[data-node]")).toBeTruthy();
    await act(async () => root.unmount());
  });

  test("React wrapper: controlled items stay until the app changes them", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    await act(async () => root.render(React.createElement(ContextTray, { items: items(), limit: 200000, onChange })));
    await settle();
    const el = host.querySelector<TcContextTray>("tc-context-tray")!;
    chips(el)[0].querySelector<HTMLButtonElement>(".ui-ctt__remove")!.click();
    await settle();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(labels(el)).toHaveLength(3);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    for (const look of ["standard", "clean"] as const)
      test(`axe: no violations (${look}, ${theme}), with Undo showing`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-tc-theme=${theme}>
          <tc-context-tray look=${look} limit="200000" reserved="46000" .items=${items()}></tc-context-tray>
        </div>`);
        const el = wrap.querySelector<TcContextTray>("tc-context-tray")!;
        chips(el)[1].querySelector<HTMLButtonElement>(".ui-ctt__remove")!.click();
        await folded();
        wrap.getAnimations({ subtree: true }).forEach((a) => a.finish());
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
});
