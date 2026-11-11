/* <tc-badge-pop> in real browsers: no motion on load, pop up, roll, shrink away at 0, max and dot, a debounced status,
 * React, and axe in both themes. */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcBadgePop } from "../../src/elements/badge-pop";
import { BadgePop } from "../../src/elements/react/badge-pop";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const badge = (count = 3) => fixture<TcBadgePop>(html`<tc-badge-pop count=${count} label="to review" announce-delay="50"><button>Queue</button></tc-badge-pop>`);
const pill = (el: Element) => el.querySelector<HTMLElement>(".ui-bdp__badge");
const status = (el: Element) => el.querySelector("[role='status']")!.textContent!.trim();

describe("tc-badge-pop", () => {
  test("shows the count without moving on first render, hidden from screen readers but said in the status", async () => {
    const el = await badge();
    expect(el.dataset.ui).toBe("bdp");
    expect(pill(el)!.textContent!.trim()).toBe("3");
    expect(pill(el)!.getAttribute("aria-hidden")).toBe("true");
    expect(pill(el)!.hasAttribute("data-motion")).toBe(false);
    expect(status(el)).toBe("3 to review");
  });

  test("rising pops and rolls up; falling rolls down without a pop; the status follows once it settles", async () => {
    expect(TcBadgePop.css).not.toMatch(/\binfinite\b/);
    const el = await badge();
    el.count = 4;
    await settle();
    expect(pill(el)!.getAttribute("data-motion")).toBe("pop");
    expect(el.querySelector(".ui-bdp__digits")!.getAttribute("data-roll")).toBe("up");
    expect(el.querySelector(".ui-bdp__out")!.textContent).toBe("3");
    await finish(el);
    await expect.poll(() => el.querySelector(".ui-bdp__out")).toBeNull();
    await expect.poll(() => status(el)).toBe("4 to review");
    el.count = 2;
    await settle();
    expect(pill(el)!.hasAttribute("data-motion")).toBe(false);
    expect(el.querySelector(".ui-bdp__digits")!.getAttribute("data-roll")).toBe("down");
  });

  test("a quick run of changes is announced once, with the last count", async () => {
    const el = await badge();
    for (const n of [4, 5, 6, 7]) {
      el.count = n;
      await el.updateComplete;
    }
    expect(status(el)).toBe("3 to review");
    await expect.poll(() => status(el)).toBe("7 to review");
  });

  test("0 shrinks it away, and a new count pops it back from nothing", async () => {
    const el = await badge();
    el.count = 0;
    await settle();
    expect(pill(el)!.getAttribute("data-motion")).toBe("out");
    await finish(el);
    await expect.poll(() => pill(el)).toBeNull();
    await expect.poll(() => status(el)).toBe("0 to review");
    el.count = 1;
    await settle();
    expect(pill(el)!.getAttribute("data-motion")).toBe("in");
    expect(pill(el)!.textContent!.trim()).toBe("1");
  });

  test("max caps the number, dot draws no number, position picks the corner", async () => {
    const el = await badge(150);
    expect(pill(el)!.textContent!.trim()).toBe("99+");
    await expect.poll(() => status(el)).toBe("150 to review");
    el.dot = true;
    el.position = "bottom-start";
    await settle();
    expect(pill(el)!.textContent!.trim()).toBe("");
    expect(el.getAttribute("position")).toBe("bottom-start");
    const b = pill(el)!.getBoundingClientRect();
    const host = el.getBoundingClientRect();
    expect(b.left).toBeLessThan(host.left + host.width / 2);
    expect(b.bottom).toBeGreaterThan(host.top + host.height / 2);
  });

  test("starts at 0 with nothing drawn", async () => {
    const el = await badge(0);
    expect(pill(el)).toBeNull();
    expect(status(el)).toBe("");
  });

  test("React wrapper: the count follows props", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const render = (count: number) => act(async () => root.render(React.createElement(BadgePop, { count, label: "new" }, React.createElement("button", null, "Inbox"))));
    await render(2);
    await settle();
    const el = host.querySelector("tc-badge-pop")!;
    expect(pill(el)!.textContent!.trim()).toBe("2");
    await render(5);
    await settle();
    expect(pill(el)!.getAttribute("data-motion")).toBe("pop");
    expect(el.querySelector("button")!.textContent).toBe("Inbox");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 24px; background: var(--tc-surface-base); display: flex; gap: 24px">
        <tc-badge-pop count="5" label="unread"><button>Inbox</button></tc-badge-pop>
        <tc-badge-pop count="120" label="unread"><button>Queue</button></tc-badge-pop>
        <tc-badge-pop count="2" dot label="new"><button>Tabs</button></tc-badge-pop>
      </div>`);
      await finish(wrap);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    });
  }
});
