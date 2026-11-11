/* <tc-like-burst> in real browsers: a toggle button, bursts only on a press, the count moves by one, the cancelable
 * event, keyboard, a page icon, React (uncontrolled and controlled), and axe in both themes. */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { TcLikeBurst, type LikeBurstPressedChange } from "../../src/elements/like-burst";
import { LikeBurst } from "../../src/elements/react/like-burst";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const like = () => fixture<TcLikeBurst>(html`<tc-like-burst label="Save finding" count="12"></tc-like-burst>`);
const button = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-lkb__button")!;
const shown = (el: Element) => el.querySelector(".ui-lkb__in")!.textContent;

describe("tc-like-burst", () => {
  test("a toggle button named by its label and count, at rest", async () => {
    const el = await like();
    expect(el.dataset.ui).toBe("lkb");
    expect(button(el).getAttribute("aria-pressed")).toBe("false");
    expect(button(el).textContent!.replace(/\s+/g, " ").trim()).toBe("Save finding 12");
    expect(el.hasAttribute("data-burst")).toBe(false);
    expect(el.querySelectorAll(".ui-lkb__particle")).toHaveLength(8);
  });

  test("pressing on bursts once and counts up; pressing off empties it without a burst and counts down", async () => {
    expect(TcLikeBurst.css).not.toMatch(/\binfinite\b/);
    const el = await like();
    const seen: LikeBurstPressedChange[] = [];
    el.addEventListener("tc-pressed-change", (e) => seen.push((e as CustomEvent<LikeBurstPressedChange>).detail));
    button(el).click();
    await settle();
    expect(el.pressed).toBe(true);
    expect(button(el).getAttribute("aria-pressed")).toBe("true");
    expect(el.hasAttribute("data-burst")).toBe(true);
    expect(el.querySelector(".ui-lkb__count")!.getAttribute("data-roll")).toBe("up");
    expect(shown(el)).toBe("13");
    await finish(el);
    await expect.poll(() => el.hasAttribute("data-burst")).toBe(false);
    button(el).click();
    await settle();
    expect(el.pressed).toBe(false);
    expect(el.hasAttribute("data-burst")).toBe(false);
    expect(shown(el)).toBe("12");
    expect(seen).toEqual([{ pressed: true, count: 13 }, { pressed: false, count: 12 }]);
  });

  test("the page setting pressed doesn't burst; preventDefault keeps it as it was", async () => {
    const el = await like();
    el.pressed = true;
    await settle();
    expect(el.hasAttribute("data-burst")).toBe(false);
    el.pressed = false;
    await settle();
    el.addEventListener("tc-pressed-change", (e) => e.preventDefault(), { once: true });
    button(el).click();
    await settle();
    expect(el.pressed).toBe(false);
    expect(el.count).toBe(12);
  });

  test("keyboard: Enter and Space toggle it; disabled does nothing", async () => {
    const el = await like();
    button(el).focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(el.pressed).toBe(true);
    await userEvent.keyboard(" ");
    await settle();
    expect(el.pressed).toBe(false);
    el.disabled = true;
    await settle();
    expect(button(el).disabled).toBe(true);
    button(el).click();
    await settle();
    expect(el.pressed).toBe(false);
  });

  test("a page icon takes the heart's place; a shown label is visible", async () => {
    const el = await fixture<TcLikeBurst>(html`<tc-like-burst label="Star" show-label><svg slot="icon" viewBox="0 0 24 24"><path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z"></path></svg></tc-like-burst>`);
    expect(getComputedStyle(el.querySelector(".ui-lkb__heart")!).visibility).toBe("hidden");
    expect(el.querySelector(".ui-lkb__label")!.textContent).toBe("Star");
    expect(el.querySelector(".ui-lkb__count")).toBeNull();
    button(el).click();
    await settle();
    expect(getComputedStyle(el.querySelector("[slot='icon']")!).fill).not.toBe("transparent");
  });

  test("React wrapper: uncontrolled survives re-renders; controlled waits for the parent and still bursts", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let bump = () => {};
    function Loose() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(LikeBurst, { label: "Helpful", count: 7, "data-n": n } as React.ComponentProps<typeof LikeBurst>);
    }
    await act(async () => root.render(React.createElement(Loose)));
    await settle();
    const el = host.querySelector("tc-like-burst")!;
    await act(async () => button(el).click());
    await act(async () => bump());
    await settle();
    expect(el.pressed).toBe(true);
    expect(shown(el)).toBe("8");
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    const seen: boolean[] = [];
    let accept = false;
    function Strict() {
      const [on, setOn] = React.useState(false);
      return React.createElement(LikeBurst, { label: "Save", pressed: on, count: on ? 3 : 2, onPressedChange: (p: boolean) => { seen.push(p); if (accept) setOn(p); } });
    }
    await act(async () => root2.render(React.createElement(Strict)));
    await settle();
    const el2 = host2.querySelector("tc-like-burst")!;
    await act(async () => button(el2).click());
    await settle();
    expect(el2.pressed).toBe(false);
    expect(shown(el2)).toBe("2");
    accept = true;
    await act(async () => button(el2).click());
    await settle();
    expect(el2.pressed).toBe(true);
    expect(shown(el2)).toBe("3");
    expect(el2.hasAttribute("data-burst")).toBe(true);
    expect(seen).toEqual([true, true]);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations, off and on`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); color: var(--tc-text-primary); display: flex; gap: 8px">
        <tc-like-burst label="Helpful" count="7"></tc-like-burst>
        <tc-like-burst label="Save finding" show-label pressed count="3"></tc-like-burst>
        <tc-like-burst label="Star" disabled></tc-like-burst>
      </div>`);
      await finish(wrap);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    });
  }
});
