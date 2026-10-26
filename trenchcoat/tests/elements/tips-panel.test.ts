/*
 * <tc-tips-panel> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/tips-panel";
import type { TcTipsPanel, TipsPanelTip } from "../../src/elements/tips-panel";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const tips: TipsPanelTip[] = [
  { id: "a", title: "First", description: "One", action: "Try A" },
  { id: "b", title: "Second", description: "Two", action: "Try B", primary: true },
];
const button = (el: Element, name: string) => [...el.querySelectorAll("button")].find((b) => b.textContent === name);
const doneIds = (el: Element) => [...el.querySelectorAll("li[data-done]")].map((li) => (li.querySelector("p")!.textContent === "First" ? "a" : "b"));

describe("tc-tips-panel", () => {
  test("the host is the root and the region, named by the heading", async () => {
    const el = await fixture<TcTipsPanel>(html`<tc-tips-panel .tips=${tips}></tc-tips-panel>`);
    expect(el.dataset.ui).toBe("tp");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Tips");
    expect(el.querySelector("h3")!.textContent).toBe("Tips");
    el.heading = "Getting started";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Getting started");
    expect(el.querySelector(".ui-tp__count")!.textContent).toBe("0/2 done");
  });

  test("uncontrolled: starts from done and reports changes", async () => {
    const el = await fixture<TcTipsPanel>(html`<tc-tips-panel .tips=${tips} .done=${["a"]}></tc-tips-panel>`);
    const onChange = vi.fn();
    const onAction = vi.fn();
    el.addEventListener("tc-done-change", (e) => onChange((e as CustomEvent).detail.done));
    el.addEventListener("tc-tip-action", (e) => onAction((e as CustomEvent).detail.id));
    expect(el.querySelector(".ui-tp__count")!.textContent).toBe("1/2 done");
    button(el, "Try B")!.click();
    await settle();
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
    expect(onAction).toHaveBeenCalledWith("b");
    expect(el.querySelector(".ui-tp__count")!.textContent).toBe("2/2 done");
    expect(doneIds(el)).toEqual(["a", "b"]);
  });

  test("controlled: preventDefault keeps done; setting it shows it, a reset brings the actions back", async () => {
    const el = await fixture<TcTipsPanel>(html`<tc-tips-panel .tips=${tips} .done=${[]}></tc-tips-panel>`);
    const onChange = vi.fn();
    el.addEventListener("tc-done-change", (e) => {
      e.preventDefault();
      onChange((e as CustomEvent).detail.done);
    });
    button(el, "Try A")!.click();
    await settle();
    expect(onChange).toHaveBeenCalledWith(["a"]);
    expect(button(el, "Try A")).toBeTruthy();
    for (const value of [["a"], ["a", "b"]]) {
      el.done = value;
      await settle();
      expect(doneIds(el)).toEqual(value);
    }
    el.done = [];
    await settle();
    expect(button(el, "Try A")).toBeTruthy();
  });

  test("taking an action moves focus onto the tip's Done mark, not <body> (2.4.3)", async () => {
    const el = await fixture<TcTipsPanel>(html`<tc-tips-panel .tips=${tips}></tc-tips-panel>`);
    const b = button(el, "Try B")!;
    b.focus();
    b.click();
    await settle();
    await settle();
    expect(document.activeElement?.textContent).toBe("Done");
    expect(document.activeElement?.closest("li")?.textContent).toMatch(/Second/);
  });

  test("keyboard: Enter and Space on an action take it", async () => {
    const el = await fixture<TcTipsPanel>(html`<tc-tips-panel .tips=${tips}></tc-tips-panel>`);
    const b = button(el, "Try A")!;
    b.focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(doneIds(el)).toEqual(["a"]);
    (button(el, "Try B") as HTMLButtonElement).focus();
    await userEvent.keyboard(" ");
    await settle();
    expect(doneIds(el)).toEqual(["a", "b"]);
  });

  test("one persistent status says which tip was done and the count; nothing else is live (4.1.3)", async () => {
    const el = await fixture<TcTipsPanel>(html`<tc-tips-panel .tips=${tips}></tc-tips-panel>`);
    const status = el.querySelector('[role="status"]')!;
    expect(status.textContent).toBe("");
    button(el, "Try A")!.click();
    await settle();
    expect([...el.querySelectorAll('[role="status"]')]).toEqual([status]);
    expect(status.textContent).toBe("First: Done. 1 of 2 done.");
    expect(el.querySelector("[aria-live]")).toBeNull();
  });

  test("Close shows only when closable and fires tc-close", async () => {
    const el = await fixture<TcTipsPanel>(html`<tc-tips-panel .tips=${tips}></tc-tips-panel>`);
    expect(el.querySelector(".ui-tp__foot")).toBeNull();
    el.closable = true;
    el.closeLabel = "Done for now";
    await settle();
    const onClose = vi.fn();
    el.addEventListener("tc-close", onClose);
    button(el, "Done for now")!.click();
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("a description node is cloned in place", async () => {
    const desc = document.createElement("span");
    desc.innerHTML = 'Press <kbd class="ui-tp__kbd">K</kbd>';
    const el = await fixture<TcTipsPanel>(html`<tc-tips-panel .tips=${[{ ...tips[0], description: desc }]}></tc-tips-panel>`);
    expect(el.querySelector(".ui-tp__tip-text kbd")!.textContent).toBe("K");
    expect(desc.isConnected).toBe(false);
  });

  test("styles: the primary action is flat ink on the action tokens and buttons use the control tokens", async () => {
    const el = await fixture<TcTipsPanel>(html`<tc-tips-panel .tips=${tips}></tc-tips-panel>`);
    const css = (el.constructor as typeof TcTipsPanel).css;
    expect(css).toMatch(/\.ui-tp__btn--primary\s*{[^}]*background: var\(--tc-action-primary-bg/);
    expect(css).not.toMatch(/linear-gradient\(light-dark/);
    expect(css).toMatch(/\.ui-tp__btn\s*{[^}]*height: var\(--tc-control-h-md/);
    expect(getComputedStyle(el.querySelector(".ui-tp__btn--primary")!).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-tips-panel .tips=${tips} .done=${["a"]} closable></tc-tips-panel>
      <tc-tips-panel look="clean" heading="Clean" .tips=${tips} closable></tc-tips-panel>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
