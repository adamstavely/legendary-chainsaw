/* <tc-drag-lift> in real browsers: lifting, following, ending, Escape, refusing, handles, no text selection, React and axe. */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/drag-lift";
import type { DragLiftMove, TcDragLift } from "../../src/elements/drag-lift";
import { DragLift } from "../../src/elements/react/drag-lift";
import { cleanup, fixture } from "./helpers";

afterEach(cleanup);

const lift = () => fixture<TcDragLift>(html`<tc-drag-lift><div class="card">Card <button>Open</button></div></tc-drag-lift>`);
const card = (el: Element) => el.querySelector<HTMLElement>(".card")!;
const down = (t: Element, pointerType = "mouse") => t.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true, button: 0, pointerId: 1, pointerType, clientX: 10, clientY: 10 }));
const move = (x: number, y: number) => window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 10 + x, clientY: 10 + y }));
const up = () => window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
const events = (el: Element, name: string) => {
  const seen: DragLiftMove[] = [];
  el.addEventListener(name, (e) => seen.push((e as CustomEvent<DragLiftMove>).detail));
  return seen;
};

describe("tc-drag-lift", () => {
  test("lifts after a small move, follows the pointer, and glides home", async () => {
    const el = await lift();
    expect(el.dataset.ui).toBe("dlf");
    const starts = events(el, "tc-drag-start");
    const ends = events(el, "tc-drag-end");
    down(card(el));
    move(1, 1);
    expect(el.hasAttribute("data-lifted")).toBe(false);
    move(30, 20);
    expect(starts).toHaveLength(1);
    expect(el.hasAttribute("data-lifted")).toBe(true);
    expect(card(el).style.getPropertyValue("--tc-dlf-x")).toBe("30px");
    up();
    expect(ends).toEqual([{ x: 30, y: 20 }]);
    expect(el.hasAttribute("data-lifted")).toBe(false);
    expect(card(el).style.getPropertyValue("--tc-dlf-x")).toBe("");
    expect(card(el).getAnimations().length).toBe(1);
  });

  test("preventDefault on the end means no glide; on the start, no lift", async () => {
    const el = await lift();
    el.addEventListener("tc-drag-end", (e) => e.preventDefault());
    down(card(el));
    move(30, 0);
    up();
    expect(card(el).getAnimations()).toHaveLength(0);
    const other = await lift();
    other.addEventListener("tc-drag-start", (e) => e.preventDefault());
    down(card(other));
    move(30, 0);
    expect(other.hasAttribute("data-lifted")).toBe(false);
    up();
  });

  test("Escape cancels and glides home, with no end", async () => {
    const el = await lift();
    const ends = events(el, "tc-drag-end");
    const cancels = events(el, "tc-drag-cancel");
    down(card(el));
    move(30, 0);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", cancelable: true }));
    expect(cancels).toEqual([{ x: 30, y: 0 }]);
    expect(el.hasAttribute("data-lifted")).toBe(false);
    expect(card(el).getAnimations().length).toBe(1);
    up();
    expect(ends).toHaveLength(0);
  });

  test("controls don't start a drag, and disabled turns it off", async () => {
    const el = await lift();
    down(el.querySelector("button")!);
    move(30, 0);
    expect(el.hasAttribute("data-lifted")).toBe(false);
    el.disabled = true;
    down(card(el));
    move(30, 0);
    expect(el.hasAttribute("data-lifted")).toBe(false);
  });

  test("touch drags only from a handle when there is one", async () => {
    const el = await fixture<TcDragLift>(html`<tc-drag-lift><div class="card"><span data-drag-handle>Grip</span> Text</div></tc-drag-lift>`);
    down(card(el), "touch");
    move(30, 0);
    expect(el.hasAttribute("data-lifted")).toBe(false);
    down(el.querySelector("[data-drag-handle]")!, "touch");
    move(30, 0);
    expect(el.hasAttribute("data-lifted")).toBe(true);
    up();
  });

  test("a drag doesn't select text, and selecting works afterwards", async () => {
    const el = await lift();
    const select = () => {
      const e = new Event("selectstart", { bubbles: true, cancelable: true });
      document.body.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(select()).toBe(false);
    down(card(el));
    expect(select()).toBe(true);
    up();
    expect(select()).toBe(false);
  });

  test("React: the wrapper reports the drag", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const seen: DragLiftMove[] = [];
    await act(async () => root.render(React.createElement(DragLift, { onTcDragEnd: (e: CustomEvent<DragLiftMove>) => seen.push(e.detail) }, React.createElement("div", { className: "card" }, "Card"))));
    const el = host.querySelector("tc-drag-lift")!;
    down(card(el));
    move(30, 0);
    up();
    expect(seen).toEqual([{ x: 30, y: 0 }]);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations", async () => {
    const el = await lift();
    const { violations } = await axe.run(el);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
