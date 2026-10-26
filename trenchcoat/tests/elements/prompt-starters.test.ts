/*
 * <tc-prompt-starters> in real browsers: groups and icons, the listbox keyboard (move, Enter by mode, → fills,
 * type-ahead), send and fill events, loading and empty states, focus when the list changes, the wrapper, and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/prompt-starters";
import type { PromptStarter, PromptStarterGroup, PromptStarterPick, TcPromptStarters } from "../../src/elements/prompt-starters";
import { PromptStarters } from "../../src/elements/react/prompt-starters";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const groups: PromptStarterGroup[] = [
  {
    id: "analyse",
    label: "Analyse",
    icon: "chart",
    tone: "blue",
    items: [
      { id: "risk", text: "Which deals are most at risk?", hint: "From the pipeline" },
      { id: "churn", text: "Compare churn by plan" },
    ],
  },
  { id: "write", label: "Write", icon: "write", tone: "violet", items: [{ id: "draft", text: "Draft a follow-up to ", label: "Draft a follow-up…", mode: "fill" }] },
];
const items: PromptStarter[] = [{ id: "loose", text: "Summarise this thread" }];

const options = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="option"]')];
const press = (target: Element, key: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
const focused = () => (document.activeElement as HTMLElement).querySelector(".ui-pst__label")?.textContent;

async function make(extra: { look?: string; variant?: string } = {}) {
  return fixture<TcPromptStarters>(html`<tc-prompt-starters look=${extra.look ?? "standard"} variant=${extra.variant ?? "starters"} heading="Start with" .groups=${groups} .items=${items}></tc-prompt-starters>`);
}

describe("tc-prompt-starters", () => {
  test("the host is the root in either look; a listbox named by the heading, groups named by theirs", async () => {
    for (const look of ["standard", "clean"]) {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("pst");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector('[role="listbox"]')!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Start with");
      const g = [...el.querySelectorAll('[role="group"]')].map((x) => document.getElementById(x.getAttribute("aria-labelledby")!)!.textContent);
      expect(g).toEqual(["Analyse", "Write"]);
      expect(options(el).map((o) => o.querySelector(".ui-pst__label")!.textContent)).toEqual(["Which deals are most at risk?", "Compare churn by plan", "Draft a follow-up…", "Summarise this thread"]);
    }
  });

  test("icons: a group's built-in icon on a tinted tile; an item's own Element is cloned", async () => {
    const mine = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    mine.setAttribute("data-mine", "");
    const el = await fixture<TcPromptStarters>(html`<tc-prompt-starters .groups=${groups} .items=${[{ id: "x", text: "Mine", icon: mine }]}></tc-prompt-starters>`);
    const tiles = [...el.querySelectorAll(".ui-pst__icon")];
    expect(tiles[0].getAttribute("data-tone")).toBe("blue");
    expect(tiles[0].querySelector("svg.ui-pst__glyph")).toBeTruthy();
    expect(tiles[3].querySelector("svg[data-mine]")).toBeTruthy();
    expect(mine.isConnected).toBe(false);
  });

  test("each option says what choosing it does; hints only for starters", async () => {
    const el = await make();
    expect(options(el)[0].textContent!.replace(/\s+/g, " ").trim()).toBe("Which deals are most at risk? From the pipeline , Ask");
    expect(options(el)[2].textContent!.replace(/\s+/g, " ").trim()).toBe("Draft a follow-up… , Edit first");
    el.variant = "follow-ups";
    await settle();
    expect(el.querySelector(".ui-pst__hint")).toBe(null);
  });

  test("click sends, or fills for a fill suggestion; the pencil fills a send suggestion", async () => {
    const el = await make();
    const sent: PromptStarterPick[] = [];
    const filled: PromptStarterPick[] = [];
    el.addEventListener("tc-send", (e) => sent.push((e as CustomEvent<PromptStarterPick>).detail));
    el.addEventListener("tc-fill", (e) => filled.push((e as CustomEvent<PromptStarterPick>).detail));
    options(el)[0].click();
    options(el)[2].click();
    options(el)[1].querySelector<HTMLElement>(".ui-pst__fill")!.click();
    expect(sent.map((p) => [p.text, p.group])).toEqual([["Which deals are most at risk?", "analyse"]]);
    expect(filled.map((p) => [p.text, p.item.id])).toEqual([["Draft a follow-up to ", "draft"], ["Compare churn by plan", "churn"]]);
  });

  test("keyboard: one tab stop; ↑ ↓ Home End move; Enter by mode; → fills; letters jump", async () => {
    const el = await make();
    const sent: string[] = [];
    const filled: string[] = [];
    el.addEventListener("tc-send", (e) => sent.push((e as CustomEvent<PromptStarterPick>).detail.text));
    el.addEventListener("tc-fill", (e) => filled.push((e as CustomEvent<PromptStarterPick>).detail.text));
    expect(options(el).filter((o) => o.tabIndex === 0)).toHaveLength(1);
    options(el)[0].focus();
    press(document.activeElement!, "ArrowDown");
    await settle();
    expect(focused()).toBe("Compare churn by plan");
    press(document.activeElement!, "End");
    await settle();
    expect(focused()).toBe("Summarise this thread");
    press(document.activeElement!, "ArrowDown");
    await settle();
    expect(focused()).toBe("Summarise this thread");
    press(document.activeElement!, "Home");
    await settle();
    expect(focused()).toBe("Which deals are most at risk?");
    press(document.activeElement!, "Enter");
    press(document.activeElement!, "ArrowRight");
    expect(sent).toEqual(["Which deals are most at risk?"]);
    expect(filled).toEqual(["Which deals are most at risk?"]);
    press(document.activeElement!, "d");
    await settle();
    expect(focused()).toBe("Draft a follow-up…");
    press(document.activeElement!, " ");
    expect(filled).toEqual(["Which deals are most at risk?", "Draft a follow-up to "]);
    expect(options(el).find((o) => o.tabIndex === 0)!.querySelector(".ui-pst__label")!.textContent).toBe("Draft a follow-up…");
    // The key hint follows the active suggestion's mode
    expect(el.querySelector(".ui-pst__foot")!.textContent!.replace(/\s+/g, " ").trim()).toBe("↑ ↓ to move ↵ Edit first");
  });

  test("type-ahead takes several letters typed quickly", async () => {
    const el = await make();
    options(el)[0].focus();
    press(document.activeElement!, "s");
    press(document.activeElement!, "u");
    await settle();
    expect(focused()).toBe("Summarise this thread");
  });

  test("loading shows busy placeholders; nothing to suggest takes no room unless there's empty text", async () => {
    const el = await fixture<TcPromptStarters>(html`<tc-prompt-starters loading></tc-prompt-starters>`);
    expect(el.querySelector('[role="listbox"]')!.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelectorAll(".ui-pst__skeleton")).toHaveLength(3);
    el.loading = false;
    await settle();
    expect(el.hasAttribute("data-empty")).toBe(true);
    expect(getComputedStyle(el).display).toBe("none");
    el.emptyText = "No suggestions yet";
    await settle();
    expect(el.hasAttribute("data-empty")).toBe(false);
    expect(el.querySelector(".ui-pst__empty")!.textContent).toBe("No suggestions yet");
  });

  test("focus stays in the list when the focused suggestion goes away", async () => {
    const el = await make();
    options(el)[3].focus();
    el.items = [];
    await settle();
    await new Promise((r) => setTimeout(r, 0));
    expect(el.contains(document.activeElement)).toBe(true);
    expect(options(el).filter((o) => o.tabIndex === 0)).toHaveLength(1);
  });

  test("the type-ahead timer is cleared on disconnect", async () => {
    const el = await make();
    options(el)[0].focus();
    press(document.activeElement!, "c");
    const clear = vi.spyOn(window, "clearTimeout");
    el.remove();
    expect(clear).toHaveBeenCalled();
  });

  test("React wrapper: title, React-node icons, onSend / onFill with the original items, survives a re-render", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onSend = vi.fn();
    const onFill = vi.fn();
    const mine = { id: "m", text: "Mine", icon: React.createElement("svg", { "data-mine": "" }) };
    function App() {
      const [n, setN] = React.useState(0);
      return React.createElement(
        "div",
        null,
        React.createElement("button", { id: "rr", onClick: () => setN(n + 1) }, `re-render ${n}`),
        React.createElement(PromptStarters, { title: "Ask next", variant: "follow-ups", items: [mine], onSend, onFill }),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcPromptStarters>("tc-prompt-starters")!;
    expect(el.heading).toBe("Ask next");
    expect(el.querySelector(".ui-pst__icon svg[data-mine]")).toBeTruthy();
    await act(async () => host.querySelector<HTMLButtonElement>("#rr")!.click());
    await settle();
    expect(el.querySelector(".ui-pst__icon svg[data-mine]")).toBeTruthy();
    options(el)[0].click();
    press(options(el)[0], "ArrowRight");
    expect(onSend).toHaveBeenCalledWith("Mine", mine);
    expect(onFill).toHaveBeenCalledWith("Mine", mine);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    for (const look of ["standard", "clean"] as const)
      test(`axe: no violations (${look}, ${theme})`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-tc-theme=${theme} style="background: var(--tc-surface-base); padding: 8px">
          <tc-prompt-starters look=${look} heading="Start with" .groups=${groups} .items=${items}></tc-prompt-starters>
          <tc-prompt-starters look=${look} variant="follow-ups" heading="Ask next" .items=${items}></tc-prompt-starters>
          <tc-prompt-starters look=${look} heading="Loading" loading></tc-prompt-starters>
        </div>`);
        wrap.querySelector<HTMLElement>('[role="option"]')!.focus();
        wrap.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity).forEach((a) => a.finish());
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ") + " " + n.failureSummary).join(", ")}`)).toEqual([]);
      });
});
