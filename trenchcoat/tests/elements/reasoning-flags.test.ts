/*
 * <tc-reasoning-flags> in real browsers: the host and both looks, spans and markers from the flags (overlapping and
 * custom kinds), the summary chip, the explanation card by hover (intent delay, moving into it) and by keyboard (focus,
 * Tab in and out, Escape), tooltip vs dialog, "Ask the model to reconsider", the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/reasoning-flags";
import type { ReasoningFlag, ReasoningOpenChange, ReasoningReconsiderDetail, TcReasoningFlags } from "../../src/elements/reasoning-flags";
import { ReasoningFlags } from "../../src/elements/react/reasoning-flags";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => cleanup());

const TEXT = "The new cache is faster because it serves requests more quickly. It may depend on the workload, but it will definitely cut costs by 40%.\n\nThe rollout has no risks. One risk is that cold starts get slower.";
const at = (phrase: string) => ({ start: TEXT.indexOf(phrase), end: TEXT.indexOf(phrase) + phrase.length });
const FLAGS: ReasoningFlag[] = [
  { id: "c", ...at("The new cache is faster because it serves requests more quickly"), kind: "circular", explanation: "“Faster” and “serves requests more quickly” say the same thing, so the reason doesn't support the claim." },
  { id: "h", ...at("It may depend on the workload, but it will definitely cut costs by 40%"), kind: "hedge-then-certain", explanation: "It allows that the result depends on the workload, then gives a definite figure anyway." },
  { id: "n", ...at("40%"), kind: "unsourced-figure", explanation: "No source or measurement is given for this number." },
  { id: "s", ...at("The rollout has no risks"), kind: "self-contradiction", explanation: "The next sentence names a risk." },
];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

const make = (o: { look?: string; flags?: ReasoningFlag[]; reconsider?: boolean; noSummary?: boolean } = {}) =>
  fixture<TcReasoningFlags>(html`<tc-reasoning-flags
    style="width: 560px"
    look=${o.look ?? "standard"}
    hover-delay="60"
    .text=${TEXT}
    .flags=${o.flags ?? FLAGS}
    .kinds=${{ "unsourced-figure": { label: "Unsourced figure" } }}
    ?reconsider=${!!o.reconsider}
    ?no-summary=${!!o.noSummary}
  ></tc-reasoning-flags>`);
const markers = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-rfl__marker")];
const spans = (el: Element, i: number) => [...el.querySelectorAll<HTMLElement>(`.ui-rfl__span[data-i~="${i}"]`)];
const card = (el: Element) => el.querySelector<HTMLElement>(".ui-rfl__pop");
const enter = (t: Element) => t.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
const leave = (t: Element) => t.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
const ready = async (el: Element, ms = 20) => {
  await wait(ms);
  await settle(el.parentElement!);
};

describe("tc-reasoning-flags", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: inline – no header; spans and markers from the flags; the text is unchanged`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("rfl");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head")).toBeNull();
      expect(el.querySelector(".ui-rfl__text")!.textContent!.length).toBeGreaterThan(0);
      // The markers are the only extra text-less nodes: the text itself reads as written
      const text = el.querySelector(".ui-rfl__text")!;
      expect([...text.childNodes].map((n) => (n.nodeType === Node.COMMENT_NODE || (n instanceof Element && n.matches(".ui-rfl__marker")) ? "" : n.textContent)).join("")).toBe(TEXT);
      expect(markers(el).map((m) => m.getAttribute("aria-label"))).toEqual([
        "Reasoning flag: Circular reasoning",
        "Reasoning flag: Unsourced figure",
        "Reasoning flag: Hedged, then certain",
        "Reasoning flag: Self-contradiction",
      ]);
      expect(spans(el, 0).map((s) => s.textContent).join("")).toBe("The new cache is faster because it serves requests more quickly");
    });
  }

  test("overlapping flags: the inner span is marked for both; each marker sits where its flag ends", async () => {
    const el = await make();
    const inner = spans(el, 2);
    expect(inner).toHaveLength(1);
    expect(inner[0].textContent).toBe("40%");
    expect(inner[0].dataset.i).toBe("2 1");
    expect(inner[0].hasAttribute("data-multi")).toBe(true);
    // "40%" ends both flags: the inner one's marker first (in reading order), then the hedge's
    expect(inner[0].nextElementSibling!.getAttribute("data-i")).toBe("2");
    expect(inner[0].nextElementSibling!.nextElementSibling!.getAttribute("data-i")).toBe("1");
  });

  test("flags outside the text are ignored; unknown kinds get a readable name", async () => {
    const el = await make({ flags: [...FLAGS, { start: 5, end: 9999, kind: "circular", explanation: "x" }, { start: 0, end: 3, kind: "too_much-jargon", explanation: "Jargon." }] });
    expect(markers(el)).toHaveLength(5);
    expect(markers(el)[0].getAttribute("aria-label")).toBe("Reasoning flag: Too much jargon");
  });

  test("the summary chip counts the flags and moves focus to the first, opening it; no-summary hides it", async () => {
    const el = await make();
    const chip = el.querySelector<HTMLButtonElement>(".ui-rfl__chip")!;
    expect(plain(chip.textContent)).toBe("4 reasoning flags");
    chip.click();
    await ready(el);
    expect(document.activeElement).toBe(markers(el)[0]);
    expect(plain(card(el)!.querySelector(".ui-rfl__kind")!.textContent)).toBe("Circular reasoning");
    const one = await make({ flags: FLAGS.slice(0, 1) });
    expect(plain(one.querySelector(".ui-rfl__chip")!.textContent)).toBe("1 reasoning flag");
    const none = await make({ noSummary: true });
    expect(none.querySelector(".ui-rfl__chip")).toBeNull();
    const empty = await make({ flags: [] });
    expect(empty.querySelector(".ui-rfl__chip")).toBeNull();
    expect(empty.querySelector(".ui-rfl__text")!.textContent).toBe(TEXT);
  });

  test("hovering a span opens its card after the delay; it shows the kind, the explanation, what it means, and the note", async () => {
    const el = await make();
    const opens: (string | null)[] = [];
    el.addEventListener("tc-open-change", (e) => opens.push((e as CustomEvent<ReasoningOpenChange>).detail.flag?.id ?? null));
    enter(spans(el, 3)[0]);
    await wait(20);
    await el.updateComplete;
    expect(card(el)).toBeNull();
    await ready(el, 80);
    const c = card(el)!;
    expect(c.getAttribute("role")).toBe("tooltip");
    expect(getComputedStyle(c).position).toBe("fixed");
    expect(document.getElementById(c.getAttribute("aria-labelledby")!)!.textContent).toContain("Self-contradiction");
    expect(plain(c.querySelector(".ui-rfl__why")!.textContent)).toBe("The next sentence names a risk.");
    expect(plain(c.querySelector(".ui-rfl__about")!.textContent)).toBe("It says one thing here and the opposite elsewhere in the same answer.");
    expect(plain(c.querySelector(".ui-rfl__note")!.textContent)).toBe("Detected automatically – it may be wrong.");
    expect(c.querySelector(".ui-rfl__ask")).toBeNull();
    expect(spans(el, 3)[0].hasAttribute("data-hot")).toBe(true);
    expect(markers(el)[3].getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(markers(el)[3].getAttribute("aria-describedby")!)).toBe(c.querySelector(".ui-rfl__why"));
    expect(opens).toEqual(["s"]);
  });

  test("the card stays while the pointer moves into it, and closes after it leaves", async () => {
    const el = await make();
    const s = spans(el, 0)[0];
    enter(s);
    await ready(el, 100);
    leave(s);
    await wait(60);
    enter(card(el)!);
    await wait(300);
    await el.updateComplete;
    expect(card(el)).not.toBeNull();
    leave(card(el)!);
    await wait(300);
    await el.updateComplete;
    expect(card(el)).toBeNull();
  });

  test("keyboard without reconsider: focus opens a tooltip that describes the marker; Esc closes it", async () => {
    const el = await make();
    markers(el)[0].focus();
    await ready(el);
    expect(card(el)!.getAttribute("role")).toBe("tooltip");
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(card(el)).toBeNull();
    expect(document.activeElement).toBe(markers(el)[0]);
  });

  test("keyboard with reconsider: Tab into the card, Shift+Tab back, Tab on to the next marker, Esc returns focus", async () => {
    const el = await make({ reconsider: true });
    const [a, b] = markers(el);
    expect(a.getAttribute("aria-haspopup")).toBe("dialog");
    a.focus();
    await ready(el);
    expect(card(el)!.getAttribute("role")).toBe("dialog");
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(card(el)!.querySelector(".ui-rfl__ask"));
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(a);
    await userEvent.keyboard("{Tab}{Tab}");
    await ready(el);
    expect(document.activeElement).toBe(b);
    expect(plain(card(el)!.querySelector(".ui-rfl__kind")!.textContent)).toBe("Unsourced figure");
    await userEvent.keyboard("{Enter}");
    await ready(el);
    expect(document.activeElement).toBe(card(el)!.querySelector(".ui-rfl__ask"));
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(card(el)).toBeNull();
    expect(document.activeElement).toBe(b);
  });

  test("Ask the model to reconsider fires tc-reconsider once per flag, then shows it was asked", async () => {
    const el = await make({ reconsider: true });
    const seen: ReasoningReconsiderDetail[] = [];
    el.addEventListener("tc-reconsider", (e) => seen.push((e as CustomEvent<ReasoningReconsiderDetail>).detail));
    markers(el)[2].click();
    await ready(el);
    const ask = card(el)!.querySelector<HTMLButtonElement>(".ui-rfl__ask")!;
    expect(plain(ask.textContent)).toBe("Ask the model to reconsider");
    ask.click();
    await el.updateComplete;
    ask.click();
    await el.updateComplete;
    expect(seen).toEqual([{ flag: FLAGS[1], index: 1 }]);
    expect(plain(card(el)!.querySelector(".ui-rfl__ask")!.textContent)).toBe("Asked to reconsider");
    expect(card(el)!.querySelector(".ui-rfl__ask")!.getAttribute("aria-disabled")).toBe("true");
    expect(plain(el.querySelector('[role="status"]')!.textContent)).toBe("Asked the model to reconsider: hedged, then certain");
    // The same flags again: still asked, and the card stays on its flag; once the flag is gone, so is "asked"
    el.flags = [...FLAGS];
    await el.updateComplete;
    expect(el.asked.size).toBe(1);
    el.flags = [FLAGS[3], FLAGS[0], FLAGS[1]];
    await el.updateComplete;
    expect(plain(card(el)!.querySelector(".ui-rfl__kind")!.textContent)).toBe("Hedged, then certain");
    el.flags = [FLAGS[0], FLAGS[3]];
    await el.updateComplete;
    expect(el.asked.size).toBe(0);
    expect(card(el)).toBeNull();
  });

  test("a click pins the card; a second click or a pointer-down outside closes it; removed flags close it", async () => {
    const el = await make();
    const m = markers(el)[0];
    m.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await ready(el);
    leave(m);
    await wait(300);
    await el.updateComplete;
    expect(card(el)).not.toBeNull();
    m.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await el.updateComplete;
    expect(card(el)).toBeNull();
    m.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await ready(el);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(card(el)).toBeNull();
    markers(el)[3].dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await ready(el);
    el.flags = FLAGS.slice(0, 2);
    await el.updateComplete;
    expect(card(el)).toBeNull();
  });

  test("openCard() opens a flag's card pinned, without moving focus; closeCard() closes it", async () => {
    const el = await make();
    el.openCard(3);
    await ready(el);
    expect(plain(card(el)!.querySelector(".ui-rfl__kind")!.textContent)).toBe("Self-contradiction");
    expect(document.activeElement).toBe(document.body);
    el.closeCard();
    await el.updateComplete;
    expect(card(el)).toBeNull();
  });

  test("the wrapper: onReconsider turns the button on and reports the flag; summary={false} hides the chip", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const rootEl = createRoot(host);
    const calls: string[] = [];
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(ReasoningFlags, { text: TEXT, flags: FLAGS, hoverDelay: 60, summary: n === 0, onReconsider: (f: ReasoningFlag, i: number) => calls.push(`${f.id}:${i}`) });
    }
    await act(async () => rootEl.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcReasoningFlags>("tc-reasoning-flags")!;
    expect(el.reconsider).toBe(true);
    expect(el.querySelector(".ui-rfl__chip")).not.toBeNull();
    markers(el)[0].click();
    await act(async () => ready(el));
    card(el)!.querySelector<HTMLButtonElement>(".ui-rfl__ask")!.click();
    expect(calls).toEqual(["c:0"]);
    await act(async () => rerender(1));
    await settle();
    expect(el.querySelector(".ui-rfl__chip")).toBeNull();
    await act(async () => rootEl.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look, with a tooltip and a dialog card open (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-reasoning-flags .text=${TEXT} .flags=${FLAGS}></tc-reasoning-flags>
        <tc-reasoning-flags look="clean" reconsider .text=${TEXT} .flags=${FLAGS}></tc-reasoning-flags>
      </div>`);
      const [std, clean] = [...wrap.querySelectorAll<TcReasoningFlags>("tc-reasoning-flags")];
      markers(std)[0].dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
      markers(clean)[3].dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
      await wait(300);
      await settle(wrap);
      expect(card(std)).not.toBeNull();
      expect(card(clean)).not.toBeNull();
      // Hot spans too
      enter(spans(std, 1)[0]);
      await settle(wrap);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
