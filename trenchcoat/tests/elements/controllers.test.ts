/*
 * The shared controllers in src/elements/internal/controllers.ts (remediation step 2.4), on a small test element.
 */
import { LitElement, html } from "lit";
import { afterEach, describe, expect, test, vi } from "vitest";
import { FocusRescueController, HotkeyController, OnScreenController, RollingController, RowWindowController } from "../../src/elements/internal/controllers";
import { cleanup, settle } from "./helpers";

afterEach(cleanup);

let n = 0;
/** A fresh light-DOM element class per test, so each gets its own controllers */
function define<T extends LitElement>(setup: (el: LitElement) => void, render: (el: LitElement) => unknown = () => html``) {
  const tag = `x-ctl-${++n}`;
  customElements.define(
    tag,
    class extends LitElement {
      constructor() {
        super();
        setup(this);
      }
      protected override createRenderRoot() {
        return this;
      }
      protected override render() {
        return render(this);
      }
    },
  );
  const el = document.createElement(tag) as T;
  document.body.append(el);
  return el;
}

describe("controllers", () => {
  test("HotkeyController: one window listener per combination; the newest instance wins; it unbinds on disconnect", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const a = vi.fn();
    const b = vi.fn();
    const one = define((el) => new HotkeyController(el, () => "mod+k", a));
    const two = define((el) => new HotkeyController(el, () => "mod+k", b));
    await settle();
    expect(add.mock.calls.filter(([type]) => type === "keydown").length).toBe(1);
    const press = () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, cancelable: true }));
    press();
    expect(b).toHaveBeenCalledTimes(1);
    expect(a).not.toHaveBeenCalled();
    two.remove();
    press();
    expect(a).toHaveBeenCalledTimes(1);
    one.remove();
    add.mockRestore();
  });

  test("OnScreenController: false once scrolled out of view", async () => {
    let ctl!: OnScreenController;
    const el = define((h) => (ctl = new OnScreenController(h)));
    el.style.cssText = "display:block;height:20px";
    await settle();
    expect(ctl.onScreen).toBe(true);
    el.style.cssText = "display:block;height:20px;position:absolute;top:-5000px";
    await new Promise((r) => setTimeout(r, 200));
    expect(ctl.onScreen).toBe(false);
  });

  test("RollingController: rolls to the new target", async () => {
    const target = { count: 0 };
    let ctl!: RollingController;
    const el = define((h) => (ctl = new RollingController(h, () => ({ ...target }), 120)));
    await settle();
    target.count = 10;
    (el as LitElement).requestUpdate();
    await new Promise((r) => setTimeout(r, 300));
    expect(ctl.shown.count).toBe(10);
  });

  test("RowWindowController: above the threshold only the rows near the viewport, below it all", async () => {
    let count = 1000;
    let ctl!: RowWindowController;
    const el = define(
      (h) => (ctl = new RowWindowController(h, { count: () => count, body: () => h.querySelector("ol"), rowSelector: "li", from: 60, overscan: 12, rowHeight: 20 })),
      () => {
        const { start, end } = ctl.compute();
        return html`<ol style="margin:0;padding:0">${Array.from({ length: end - start }, (_, i) => html`<li style="height:20px">${start + i}</li>`)}</ol>`;
      },
    );
    await settle();
    await settle();
    expect(el.querySelectorAll("li").length).toBeLessThan(120);
    count = 40;
    (el as LitElement).requestUpdate();
    await settle();
    expect(el.querySelectorAll("li").length).toBe(40);
  });

  test("FocusRescueController: a removed focused button hands focus to the fallback, not <body>", async () => {
    const el = define(
      (h) => new FocusRescueController(h, () => h.querySelector<HTMLElement>("#keep")),
      () => html`<button id="keep">Keep</button><button id="gone">Gone</button>`,
    );
    await settle();
    el.querySelector<HTMLButtonElement>("#gone")!.focus();
    el.querySelector("#gone")!.remove();
    await settle();
    expect(document.activeElement?.id).toBe("keep");
  });
});
