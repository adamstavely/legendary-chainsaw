/*
 * <tc-chat-minimap> in real browsers: the listbox and its options, tick lengths, following a scroller, jumping by click
 * and keys (and holding still while the jump scrolls), preventable jumps and changes, manual mode, the message shown
 * with the keys, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/chat-minimap";
import type { ChatMarker, ChatMinimapCurrentChange, ChatMinimapJump, TcChatMinimap } from "../../src/elements/chat-minimap";
import { ChatMinimap } from "../../src/elements/react/chat-minimap";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const LONG = "Draft a note for the case file explaining why the March transfers look consistent with the seasonal pattern, with the figures from the 2024 and 2025 reviews and the analyst who signed them off, and anything that would change that view.";
const ITEMS: ChatMarker[] = [
  { id: "q1", text: "Summarise the open alerts." },
  { id: "q2", text: "Which of those involve payments over €10,000, and which were reviewed last quarter?" },
  { id: "q3", text: LONG },
  { id: "q4", text: "What's missing?" },
  { id: "q5", text: "Write up the findings." },
];
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const rail = (el: Element) => el.querySelector<HTMLElement>("[role=listbox]")!;
const options = (el: Element) => [...el.querySelectorAll<HTMLElement>("[role=option]")];
const selected = (el: Element) => options(el).filter((o) => o.getAttribute("aria-selected") === "true").map((o) => o.dataset.id);

/** A scroller of 5 tall messages, ids m-q1 … m-q5, and a rail following it */
async function chat(extra: { manual?: boolean } = {}) {
  const wrap = await fixture(html`<div style="display: flex; gap: 8px">
    <div class="scroller" style="height: 300px; width: 300px; overflow-y: auto">
      ${ITEMS.map((i) => html`<div id=${`m-${i.id}`} style="height: 400px">${i.text}</div>`)}
    </div>
    <tc-chat-minimap ?manual=${!!extra.manual} .items=${ITEMS.map((i) => ({ ...i, target: `m-${i.id}` }))}></tc-chat-minimap>
  </div>`);
  const scroller = wrap.querySelector<HTMLElement>(".scroller")!;
  const el = wrap.querySelector<TcChatMinimap>("tc-chat-minimap")!;
  el.scrollRoot = scroller;
  await settle();
  return { el, scroller };
}

describe("tc-chat-minimap", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a listbox of the messages, one tab stop, each read with where it falls`, async () => {
      const el = await fixture<TcChatMinimap>(html`<tc-chat-minimap look=${look} manual current="q2" .items=${ITEMS}></tc-chat-minimap>`);
      expect(el.dataset.ui).toBe("cmm");
      expect(el.dataset.look).toBe(look);
      expect(rail(el).getAttribute("aria-label")).toBe("Your messages");
      expect(rail(el).tabIndex).toBe(0);
      expect(options(el)).toHaveLength(5);
      expect(options(el).every((o) => !o.hasAttribute("tabindex"))).toBe(true);
      expect(selected(el)).toEqual(["q2"]);
      expect(rail(el).getAttribute("aria-activedescendant")).toBe(options(el)[1].id);
      expect(options(el)[1].querySelector(".tc-sr-only")!.textContent).toBe("Which of those involve payments over €10,000, and which were reviewed last quarter?, 2 of 5, in view");
      expect(options(el)[0].querySelector(".tc-sr-only")!.textContent).toBe("Summarise the open alerts., 1 of 5");
      expect(options(el)[0].querySelector(".ui-cmm__tip")!.getAttribute("aria-hidden")).toBe("true");
    });
  }

  test("tick lengths follow the message's; a long message is clipped in the bubble", async () => {
    const el = await fixture<TcChatMinimap>(html`<tc-chat-minimap manual .items=${ITEMS}></tc-chat-minimap>`);
    expect(options(el).map((o) => o.querySelector<HTMLElement>(".ui-cmm__tick")!.dataset.size)).toEqual(["sm", "md", "md", "sm", "sm"]);
    el.items = [{ id: "x", text: LONG + " " + LONG }];
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-cmm__tick")!.dataset.size).toBe("lg");
    const tip = el.querySelector(".ui-cmm__tip-text")!.textContent!;
    expect(tip.length).toBe(140);
    expect(tip.endsWith("…")).toBe(true);
    const w = (size: string) => {
      const t = el.querySelector<HTMLElement>(".ui-cmm__tick")!;
      // Measured settled, not partway through the width transition
      t.style.transition = "none";
      t.dataset.size = size;
      return t.getBoundingClientRect().width;
    };
    expect(w("sm")).toBeLessThan(w("md"));
    expect(w("md")).toBeLessThan(w("lg"));
  });

  test("follows the scroller: the last message whose top has passed the reading line; tc-current-change", async () => {
    const { el, scroller } = await chat();
    await expect.poll(() => el.current).toBe("q1");
    const seen: (string | null)[] = [];
    el.addEventListener("tc-current-change", (e) => seen.push((e as CustomEvent<ChatMinimapCurrentChange>).detail.current));
    scroller.scrollTop = 850;
    scroller.dispatchEvent(new Event("scroll"));
    await expect.poll(() => el.current).toBe("q3");
    expect(selected(el)).toEqual(["q3"]);
    scroller.scrollTop = 0;
    scroller.dispatchEvent(new Event("scroll"));
    await expect.poll(() => el.current).toBe("q1");
    expect(seen).toEqual(["q3", "q1"]);
    // Prevented, it stays
    el.addEventListener("tc-current-change", (e) => e.preventDefault());
    scroller.scrollTop = 1700;
    scroller.dispatchEvent(new Event("scroll"));
    await settle();
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.current).toBe("q1");
  });

  test("a click jumps: tc-jump, the chat scrolls to the message, which is lit at once", async () => {
    const { el, scroller } = await chat();
    const jumps: string[] = [];
    el.addEventListener("tc-jump", (e) => jumps.push((e as CustomEvent<ChatMinimapJump>).detail.id));
    options(el)[3].click();
    await settle();
    expect(jumps).toEqual(["q4"]);
    expect(el.current).toBe("q4");
    await expect.poll(() => Math.round(scroller.scrollTop), { timeout: 4000 }).toBe(1200);
    // Held on q4 while it scrolls, and after
    expect(el.current).toBe("q4");
    // Prevented: no scroll, no change
    el.addEventListener("tc-jump", (e) => e.preventDefault(), { once: true });
    options(el)[0].click();
    await settle();
    expect(el.current).toBe("q4");
    expect(Math.round(scroller.scrollTop)).toBe(1200);
  });

  test("keys: ↑ / ↓ and Home / End move and show the message; Enter jumps; Escape hides it", async () => {
    const { el, scroller } = await chat();
    await expect.poll(() => el.current).toBe("q1");
    rail(el).focus();
    await settle();
    const shown = () => el.querySelector<HTMLElement>(".ui-cmm__mark[data-active]")?.dataset.id;
    expect(shown()).toBe("q1");
    key(rail(el), "ArrowDown");
    key(rail(el), "ArrowDown");
    await settle();
    expect(shown()).toBe("q3");
    expect(rail(el).getAttribute("aria-activedescendant")).toBe(options(el)[2].id);
    expect(getComputedStyle(el.querySelector(".ui-cmm__mark[data-active] .ui-cmm__tip")!).display).toBe("grid");
    expect(el.current).toBe("q1");
    key(rail(el), "End");
    await settle();
    expect(shown()).toBe("q5");
    key(rail(el), "Home");
    key(rail(el), "ArrowDown");
    await settle();
    key(rail(el), "Enter");
    await settle();
    expect(el.current).toBe("q2");
    await expect.poll(() => Math.round(scroller.scrollTop), { timeout: 4000 }).toBe(400);
    key(rail(el), "Escape");
    await settle();
    expect(shown()).toBeUndefined();
  });

  test("manual: no following and no scrolling; tc-jump and `current` are the page's", async () => {
    const { el, scroller } = await chat({ manual: true });
    expect(el.current).toBeNull();
    scroller.scrollTop = 850;
    scroller.dispatchEvent(new Event("scroll"));
    await settle();
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.current).toBeNull();
    const jumps: string[] = [];
    el.addEventListener("tc-jump", (e) => jumps.push((e as CustomEvent<ChatMinimapJump>).detail.id));
    options(el)[4].click();
    await settle();
    expect(jumps).toEqual(["q5"]);
    expect(el.current).toBe("q5");
    expect(scroller.scrollTop).toBe(850);
  });

  test("empty: no options and no tab stop", async () => {
    const el = await fixture<TcChatMinimap>(html`<tc-chat-minimap></tc-chat-minimap>`);
    expect(options(el)).toHaveLength(0);
    expect(rail(el).tabIndex).toBe(-1);
  });

  test("React wrapper: uncontrolled keeps the jump through re-renders; controlled waits for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: (string | null)[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ChatMinimap, { manual: true, items: ITEMS, defaultCurrent: "q1", onCurrentChange: (c) => void seen.push(c), "data-n": n } as React.ComponentProps<typeof ChatMinimap>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-chat-minimap")!;
    options(el)[2].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.current).toBe("q3");
    expect(seen).toEqual(["q3"]);
    await act(async () => root.render(React.createElement(ChatMinimap, { manual: true, items: ITEMS, current: "q1", onCurrentChange: (c) => void seen.push(c) })));
    await settle();
    const controlled = host.querySelector("tc-chat-minimap")!;
    options(controlled)[3].click();
    await settle();
    expect(seen).toEqual(["q3", "q4"]);
    expect(controlled.current).toBe("q1");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="display: flex; gap: 48px; padding: 16px 16px 16px 320px; background: var(--tc-surface-base)">
        <tc-chat-minimap manual current="q2" .items=${ITEMS}></tc-chat-minimap>
        <tc-chat-minimap look="clean" manual current="q4" label="Your questions" .items=${ITEMS}></tc-chat-minimap>
      </div>`);
      const first = wrap.querySelector("tc-chat-minimap")!;
      rail(first).focus();
      key(rail(first), "ArrowDown");
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
