/*
 * <tc-toaster> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/toaster";
import { resetToasts, toast, type TcToaster } from "../../src/elements/toaster";
import { cleanup, fixture, settle } from "./helpers";

const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const updated = async () => {
  for (const el of document.querySelectorAll("tc-toaster")) await el.updateComplete;
  for (const el of document.querySelectorAll("tc-toaster")) await el.updateComplete;
};
/** Fake time moves in steps; the toaster updates after each */
const advance = async (ms: number, step = 100) => {
  for (let t = 0; t < ms; t += step) {
    vi.advanceTimersByTime(step);
    await updated();
  }
};
const alive = (el: Element) => [...el.querySelectorAll<HTMLElement>("[data-toast-id]:not([data-removing])")];

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] }));
afterEach(() => {
  resetToasts();
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

describe("tc-toaster", () => {
  test("the host is the root and the region, named by the label and the hotkey", async () => {
    const el = await fixture<TcToaster>(html`<tc-toaster inline></tc-toaster>`);
    expect(el.dataset.ui).toBe("ts");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Notifications (F8)");
    expect(el.tabIndex).toBe(-1);
    expect(el.dataset.y).toBe("bottom");
    expect(el.dataset.x).toBe("right");
    expect(el.hasAttribute("data-inline")).toBe(true);
    expect(el.hasAttribute("data-empty")).toBe(true);
    expect(getComputedStyle(el).position).toBe("absolute");
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("re-showing an id within the exit time enters fresh and stays for its duration", async () => {
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look}></tc-toaster>`);
        toast("Saved", { id: "save", duration: 1000 });
        await updated();
        await frame();
        await frame();
        await advance(1100); // its timer ran out – it's exiting now
        expect(el.querySelectorAll('[data-toast-id="save"][data-removing]')).toHaveLength(1);
        toast("Saved again", { id: "save", duration: 1000 });
        await updated();
        await frame();
        await frame();
        await updated();
        await advance(500);
        const live = alive(el).filter((n) => n.dataset.toastId === "save");
        expect(live).toHaveLength(1);
        expect(live[0].textContent).toContain("Saved again");
        expect(live[0].style.opacity).toBe("1");
        toast.dismiss();
        await advance(600);
        expect(el.querySelectorAll("[data-toast-id]")).toHaveLength(0);
      });

      test("hotkey = false: F8 is left alone", async () => {
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look} .hotkey=${false}></tc-toaster>`);
        toast("Saved", { duration: Infinity });
        await updated();
        const event = new KeyboardEvent("keydown", { key: "F8", cancelable: true });
        window.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
        expect(el.contains(document.activeElement)).toBe(false);
        expect(el.getAttribute("aria-label")).toBe("Notifications");
      });

      test("several toasters register one window listener; F8 focuses the stack that has a toast", async () => {
        const add = vi.spyOn(window, "addEventListener");
        const wrap = await fixture(html`<div><tc-toaster look=${look}></tc-toaster><tc-toaster look=${look} stack="side"></tc-toaster></div>`);
        expect(add.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
        toast("Side note", { toaster: "side", duration: Infinity });
        await updated();
        const event = new KeyboardEvent("keydown", { key: "F8", cancelable: true });
        window.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect((document.activeElement as HTMLElement).dataset.toastId).toBeTruthy();
        expect(wrap.querySelectorAll("tc-toaster")[1].contains(document.activeElement)).toBe(true);
      });

      test("resetToasts empties the store at once", async () => {
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look}></tc-toaster>`);
        toast("One");
        toast("Two");
        await updated();
        expect(el.querySelectorAll("[data-toast-id]")).toHaveLength(2);
        resetToasts();
        await updated();
        expect(el.querySelectorAll("[data-toast-id]")).toHaveLength(0);
      });

      /* WCAG + design pass: 2.2.1 timing for action toasts, pause on any focus, focus never drops to <body> */
      test("a toast with an action stays until it's dismissed (2.2.1); a plain one still times out", async () => {
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look}></tc-toaster>`);
        toast("Archived", { action: { label: "Undo", onClick: () => {} } });
        toast("Saved");
        await updated();
        await advance(5000);
        expect(alive(el)).toHaveLength(1);
        expect(alive(el)[0].textContent).toContain("Archived");
        expect(el.querySelector(".ui-ts__timer")).toBeNull();
      });

      test("actionDuration and a toast's own duration still apply when given", async () => {
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look} actionDuration="1000"></tc-toaster>`);
        toast("Archived", { action: { label: "Undo", onClick: () => {} } });
        toast("Moved", { duration: 2000, action: { label: "Undo", onClick: () => {} } });
        await updated();
        await advance(1200);
        expect(alive(el).map((n) => n.textContent)).toEqual([expect.stringContaining("Moved")]);
      });

      test("any focus inside pauses the timer, not only keyboard focus", async () => {
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look}></tc-toaster>`);
        toast("Saved", { duration: 1000 });
        await updated();
        const node = el.querySelector<HTMLElement>("[data-toast-id]")!;
        node.focus();
        await updated();
        await advance(2000);
        expect(alive(el)).toHaveLength(1);
        node.blur();
        await updated();
        await advance(1200);
        expect(alive(el)).toHaveLength(0);
      });

      test("closing the focused toast moves focus to the next toast, then to the region – never <body> (2.4.3)", async () => {
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look}></tc-toaster>`);
        toast("One", { duration: Infinity });
        toast("Two", { duration: Infinity });
        await updated();
        const close = () => el.querySelector<HTMLButtonElement>("[data-toast-id]:not([data-removing]) .ui-ts__close")!;
        close().focus();
        close().click();
        await settle();
        expect((document.activeElement as HTMLElement).closest("[data-toast-id]")?.textContent).toContain("One");
        close().click();
        await settle();
        expect(document.activeElement).not.toBe(document.body);
        expect(el.contains(document.activeElement)).toBe(true);
      });

      test("the action button moves focus on as well, and both live regions exist from the start", async () => {
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look}></tc-toaster>`);
        expect(el.querySelector('[role="status"]')).toBeTruthy();
        expect(el.querySelector('[role="alert"]')).toBeTruthy();
        const clicked: MouseEvent[] = [];
        toast("Older", { duration: Infinity });
        toast("Archived", { action: { label: "Undo", onClick: (e) => clicked.push(e) } });
        await updated();
        const undo = el.querySelector<HTMLButtonElement>(".ui-ts__action")!;
        undo.focus();
        undo.click();
        await settle();
        expect(clicked).toHaveLength(1);
        expect((document.activeElement as HTMLElement).closest("[data-toast-id]")?.textContent).toContain("Older");
      });

      test("an action that calls preventDefault() keeps its toast", async () => {
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look}></tc-toaster>`);
        toast("Archived", { action: { label: "Undo", onClick: (e) => e.preventDefault() } });
        await updated();
        el.querySelector<HTMLButtonElement>(".ui-ts__action")!.click();
        await updated();
        expect(alive(el)).toHaveLength(1);
      });

      test("Esc dismisses the focused toast; onDismiss is called", async () => {
        const dismissed: unknown[] = [];
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look}></tc-toaster>`);
        toast("One", { id: "one", duration: Infinity, onDismiss: (id) => dismissed.push(id) });
        toast("Two", { id: "two", duration: Infinity, onDismiss: (id) => dismissed.push(id) });
        await updated();
        const one = el.querySelector<HTMLElement>('[data-toast-id="one"]')!;
        one.focus();
        one.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        await updated();
        expect(dismissed).toEqual(["one"]);
        expect((document.activeElement as HTMLElement).dataset.toastId).toBe("two");
      });

      test("new toasts are read out: errors in the alert, others in the status", async () => {
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look}></tc-toaster>`);
        toast.success("Invoice sent", { description: "INV-2041" });
        await updated();
        await updated();
        expect(el.querySelector('[role="status"]')!.textContent).toBe("Invoice sent. INV-2041");
        toast.error("Upload failed");
        await updated();
        await updated();
        expect(el.querySelector('[role="alert"]')!.textContent).toBe("Upload failed");
      });

      test("a promise toast turns from loading into success, in place", async () => {
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look}></tc-toaster>`);
        let resolve!: (v: string) => void;
        const run = toast.promise(new Promise<string>((r) => (resolve = r)), { loading: "Deploying…", success: (v) => ({ title: `Deployed ${v}`, description: "Live" }), error: "Failed" });
        await updated();
        expect(el.querySelector("[data-toast-id]")!.getAttribute("data-type")).toBe("loading");
        resolve("v2");
        await run;
        await updated();
        const node = el.querySelector("[data-toast-id]:not([data-removing])")!;
        expect(node.getAttribute("data-type")).toBe("success");
        expect(node.querySelector(".ui-ts__copy:not(.ui-ts__ghost)")!.textContent).toBe("Deployed v2Live");
        // The old text crossfades out
        expect(node.querySelector(".ui-ts__ghost")!.textContent).toBe("Deploying…");
      });

      test("a custom icon is cloned in place of the status icon", async () => {
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("data-mine", "");
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look}></tc-toaster>`);
        toast("Custom", { icon });
        await updated();
        expect(el.querySelector('.ui-ts__icon[data-type="custom"] svg[data-mine]')).toBeTruthy();
        expect(icon.isConnected).toBe(false);
      });

      test("the stack fans out on hover and folds back", async () => {
        const el = await fixture<TcToaster>(html`<tc-toaster look=${look}></tc-toaster>`);
        toast("One", { duration: Infinity });
        toast("Two", { duration: Infinity });
        await updated();
        expect(el.hasAttribute("data-expanded")).toBe(false);
        el.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
        await updated();
        expect(el.hasAttribute("data-expanded")).toBe(true);
        el.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
        await updated();
        expect(el.hasAttribute("data-expanded")).toBe(false);
      });
    });
  }

  test("the close button is 24px and focus outlines use the focus tokens", async () => {
    await fixture(html`<tc-toaster></tc-toaster>`);
    const css = (customElements.get("tc-toaster") as unknown as { css: string }).css;
    expect(css).toMatch(/\.ui-ts__close \{[^}]*width: 24px;[^}]*height: 24px;/);
    expect(css).not.toMatch(/[^-]outline: 2px solid var/);
    expect(css).not.toContain("9999");
  });

  test("timers stop when the element leaves the page", async () => {
    const el = await fixture<TcToaster>(html`<tc-toaster></tc-toaster>`);
    toast("Saved", { duration: 1000 });
    await updated();
    expect(vi.getTimerCount()).toBe(1);
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("axe: no violations in either look", async () => {
    vi.useRealTimers();
    const wrap = await fixture(html`<div>
      <tc-toaster inline></tc-toaster>
      <tc-toaster inline look="clean" stack="clean"></tc-toaster>
    </div>`);
    toast.success("Invoice sent", { description: "INV-2041", duration: Infinity });
    toast("Archived", { toaster: "clean", duration: Infinity, action: { label: "Undo", onClick: () => {} } });
    await settle();
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
