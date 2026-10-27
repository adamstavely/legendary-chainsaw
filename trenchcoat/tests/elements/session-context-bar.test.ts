/*
 * <tc-session-context-bar> in real browsers – the chips and their labels, tones and the budget meter, fitting and
 * "+N more" with its list, editable chips and tc-term-edit, the toolbar keys, the flash and announcement when a term
 * changes (and none with reduced motion), locked and sticky, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/session-context-bar";
import type { SessionTerm, SessionTermChange, SessionTermEditDetail, TcSessionContextBar } from "../../src/elements/session-context-bar";
import { SessionContextBar } from "../../src/elements/react/session-context-bar";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const TERMS: SessionTerm[] = [
  { id: "intent", value: "Compare two suppliers" },
  { id: "knowledge", value: "Sources and model knowledge", editable: true },
  { id: "scope", value: "Procurement team" },
  { id: "review", value: "Before anything is shared" },
  { id: "posture", value: "Normal", tone: "success", editable: true },
  { id: "release", value: "Internal draft only" },
  { id: "deadline", value: "Fri 17:00" },
  { id: "budget", value: "62% of $500", meter: 0.62 },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const chips = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-scxb__chips > .ui-scxb__chip")];
const shown = (el: Element) => chips(el).filter((c) => !c.hasAttribute("data-off"));
const more = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-scxb__more")!;
const pop = (el: Element) => el.querySelector<HTMLElement>(".ui-scxb__pop")!;
const said = (el: Element) => text(el.querySelector('[role="status"]'));
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const frames = async (n = 2) => {
  for (let i = 0; i < n; i++) {
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await settle();
  }
};
const make = async (width = 1400, terms = TERMS, attrs = html``) => {
  const wrap = await fixture<HTMLElement>(html`<div style="width: ${width}px">
    <tc-session-context-bar .terms=${terms}>${attrs}</tc-session-context-bar>
  </div>`);
  await frames();
  return wrap.querySelector<TcSessionContextBar>("tc-session-context-bar")!;
};

describe("tc-session-context-bar", () => {
  test("the host is the root, a region named by its label; it sticks by default", async () => {
    const el = await make();
    expect(el.dataset.ui).toBe("scxb");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Session terms");
    expect(el.hasAttribute("data-sticky")).toBe(true);
    expect(getComputedStyle(el).position).toBe("sticky");
    el.stickyTop = 48;
    await settle();
    expect(getComputedStyle(el).top).toBe("48px");
    el.sticky = false;
    await settle();
    expect(getComputedStyle(el).position).not.toBe("sticky");
    // It's a strip: no card header
    expect(el.querySelector(".tc-head")).toBeNull();
  });

  test("each term is a labelled chip; the usual ids get their labels, others use their own", async () => {
    const el = await make(1800);
    expect(shown(el).map((c) => text(c.querySelector(".ui-scxb__label")))).toEqual(["Intent", "Knowledge", "Scope", "Review", "Posture", "Release limit", "Deadline", "Budget used"]);
    expect(text(chips(el)[0])).toBe("Intent: Compare two suppliers");
    el.terms = [{ id: "matter", value: "Supplier review" }, { id: "intent", label: "Goal", value: "Pick one" }];
    el.termLabels = { matter: "Project" };
    await frames();
    expect(chips(el).map((c) => text(c.querySelector(".ui-scxb__label")))).toEqual(["Project", "Goal"]);
  });

  test("tones show as a dot; the budget is a meter with its value as given", async () => {
    const el = await make(1800);
    const posture = el.querySelector<HTMLElement>('.ui-scxb__chip[data-id="posture"]')!;
    expect(posture.querySelector<HTMLElement>(".ui-scxb__dot")!.dataset.tone).toBe("success");
    expect(el.querySelector('.ui-scxb__chip[data-id="intent"] .ui-scxb__dot')).toBeNull();
    const meter = el.querySelector<HTMLElement>('.ui-scxb__chip[data-id="budget"] .ui-scxb__meter')!;
    expect(meter.getAttribute("role")).toBe("meter");
    expect(meter.getAttribute("aria-valuenow")).toBe("62");
    expect(meter.getAttribute("aria-valuetext")).toBe("62% of $500");
    expect(meter.getAttribute("aria-label")).toBe("Budget used");
    expect(meter.dataset.tone).toBe("neutral");
    expect(meter.querySelector<HTMLElement>(".ui-scxb__meter-fill")!.style.width).toBe("62%");
    el.terms = TERMS.map((t) => (t.id === "budget" ? { ...t, value: "91% of $500", meter: 0.91 } : t));
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-scxb__meter")!.dataset.tone).toBe("danger");
    el.meterDanger = 0.95;
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-scxb__meter")!.dataset.tone).toBe("warning");
  });

  test("what doesn't fit goes behind +N more; the count follows the width", async () => {
    const el = await make(640);
    const n = shown(el).length;
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(TERMS.length);
    expect(text(more(el))).toBe(`+${TERMS.length - n} more`);
    expect(more(el).getAttribute("aria-label")).toBe(`${TERMS.length - n} more terms`);
    expect(el.visibleCount).toBe(n);
    // Everything shown fits on one line
    const bar = el.querySelector<HTMLElement>(".ui-scxb__bar")!.getBoundingClientRect();
    for (const c of [...shown(el), more(el)]) expect(c.getBoundingClientRect().right).toBeLessThanOrEqual(bar.right + 0.5);
    // Hidden chips are out of the accessibility tree
    expect(chips(el)[n].getAttribute("aria-hidden")).toBe("true");
    // Wider: more fit
    (el.parentElement as HTMLElement).style.width = "1800px";
    await frames(3);
    expect(shown(el).length).toBe(TERMS.length);
    expect(more(el).hasAttribute("data-off")).toBe(true);
  });

  test("maxVisible caps the chips however wide the bar is", async () => {
    const el = await make(1800);
    el.maxVisible = 3;
    await frames();
    expect(shown(el).length).toBe(3);
    expect(text(more(el))).toBe("+5 more");
  });

  test("+N more opens a list of the rest; Escape closes it and focus goes back", async () => {
    const el = await make(1800);
    el.maxVisible = 3;
    await frames();
    expect(more(el).getAttribute("aria-expanded")).toBe("false");
    expect(pop(el).hidden).toBe(true);
    expect(more(el).getAttribute("aria-controls")).toBe(pop(el).id);
    more(el).click();
    await settle();
    expect(more(el).getAttribute("aria-expanded")).toBe("true");
    expect(pop(el).hidden).toBe(false);
    expect(pop(el).getAttribute("aria-label")).toBe("More session terms");
    const items = [...pop(el).querySelectorAll<HTMLElement>(".ui-scxb__item")];
    expect(items.map((i) => i.dataset.id)).toEqual(["review", "posture", "release", "deadline", "budget"]);
    expect(text(items[0])).toBe("Review: Before anything is shared");
    // An editable term in the list is a button; ArrowDown from +N more goes into the list
    more(el).click();
    await settle();
    expect(pop(el).hidden).toBe(true);
    more(el).focus();
    await key(more(el), "ArrowDown");
    expect(pop(el).hidden).toBe(false);
    expect(document.activeElement).toBe(pop(el).querySelector(".ui-scxb__item-btn"));
    await key(document.activeElement!, "Escape");
    expect(pop(el).hidden).toBe(true);
    expect(document.activeElement).toBe(more(el));
  });

  test("the list closes on a click outside it", async () => {
    const el = await make(1800);
    el.maxVisible = 2;
    await frames();
    more(el).click();
    await settle();
    expect(pop(el).hidden).toBe(false);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(pop(el).hidden).toBe(true);
  });

  test("in the list, ↑ ↓ Home End move between editable terms", async () => {
    const terms = TERMS.map((t) => ({ ...t, editable: true }));
    const el = await make(1800, terms);
    el.maxVisible = 4;
    await frames();
    more(el).focus();
    await key(more(el), "ArrowDown");
    const btns = [...pop(el).querySelectorAll<HTMLElement>(".ui-scxb__item-btn")];
    expect(btns).toHaveLength(4);
    expect(document.activeElement).toBe(btns[0]);
    await key(btns[0], "ArrowDown");
    expect(document.activeElement).toBe(btns[1]);
    await key(btns[1], "End");
    expect(document.activeElement).toBe(btns[3]);
    await key(btns[3], "ArrowDown");
    expect(document.activeElement).toBe(btns[3]);
    await key(btns[3], "Home");
    expect(document.activeElement).toBe(btns[0]);
    await key(btns[0], "ArrowUp");
    expect(document.activeElement).toBe(btns[0]);
  });

  test("editable chips are buttons that fire tc-term-edit with the chip as the anchor; read-only ones are text", async () => {
    const el = await make(1800);
    const seen: SessionTermEditDetail[] = [];
    el.addEventListener("tc-term-edit", (e) => seen.push((e as CustomEvent<SessionTermEditDetail>).detail));
    const knowledge = el.querySelector<HTMLButtonElement>('.ui-scxb__chip[data-id="knowledge"]')!;
    expect(knowledge.tagName).toBe("BUTTON");
    expect(text(knowledge)).toBe("Knowledge: Sources and model knowledge, change");
    expect(el.querySelector('.ui-scxb__chip[data-id="intent"]')!.tagName).toBe("SPAN");
    knowledge.click();
    await settle();
    expect(seen).toHaveLength(1);
    expect(seen[0].term.id).toBe("knowledge");
    expect(seen[0].anchor).toBe(knowledge);
    // In the list too
    el.maxVisible = 2;
    await frames();
    more(el).click();
    await settle();
    pop(el).querySelector<HTMLButtonElement>(".ui-scxb__item-btn")!.click();
    expect(seen.at(-1)!.term.id).toBe("posture");
  });

  test("editable on the bar makes every term editable unless it says otherwise; locked makes none", async () => {
    const terms = TERMS.map((t) => (t.id === "deadline" ? { ...t, editable: false } : t));
    const el = await make(1800, terms);
    el.editable = true;
    await frames();
    expect(chips(el).filter((c) => c.tagName === "BUTTON").map((c) => c.dataset.id)).toEqual(["intent", "knowledge", "scope", "review", "posture", "release", "budget"]);
    // The budget's meter inside a button is hidden; the value says it
    expect(el.querySelector('.ui-scxb__chip[data-id="budget"] .ui-scxb__meter')!.getAttribute("aria-hidden")).toBe("true");
    el.locked = true;
    await frames();
    expect(chips(el).filter((c) => c.tagName === "BUTTON")).toHaveLength(0);
    expect(text(el.querySelector(".ui-scxb__lock"))).toBe("Fixed for this session");
  });

  test("keyboard: the bar is a toolbar – one tab stop, ← → Home End across editable chips and +N more", async () => {
    const el = await make(1800);
    el.maxVisible = 5;
    await frames();
    const bar = el.querySelector<HTMLElement>(".ui-scxb__bar")!;
    expect(bar.getAttribute("role")).toBe("toolbar");
    expect(bar.getAttribute("aria-label")).toBe("Session terms");
    const items = () => [...bar.querySelectorAll<HTMLElement>("button.ui-scxb__chip:not([data-off]), .ui-scxb__more:not([data-off])")];
    expect(items().map((b) => b.dataset.id ?? "more")).toEqual(["knowledge", "posture", "more"]);
    expect(items().map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    items()[0].focus();
    await key(items()[0], "ArrowRight");
    expect(document.activeElement).toBe(items()[1]);
    await key(items()[1], "End");
    expect(document.activeElement).toBe(more(el));
    await key(more(el), "ArrowRight");
    expect(document.activeElement).toBe(items()[0]);
    await key(items()[0], "ArrowLeft");
    expect(document.activeElement).toBe(more(el));
    // Nothing to operate: a group, not a toolbar
    const quiet = await make(1800, [{ id: "intent", value: "Read only" }]);
    expect(quiet.querySelector(".ui-scxb__bar")!.getAttribute("role")).toBe("group");
  });

  test("a changed term flashes once and is announced; tc-terms-changed lists the changes", async () => {
    const el = await make(1800);
    const seen: SessionTermChange[][] = [];
    el.addEventListener("tc-terms-changed", (e) => seen.push((e as CustomEvent<{ changes: SessionTermChange[] }>).detail.changes));
    el.terms = TERMS.map((t) => (t.id === "posture" ? { ...t, value: "Elevated", tone: "warning" as const } : t));
    await settle();
    expect(said(el)).toBe("Posture: Elevated.");
    expect(seen).toHaveLength(1);
    expect(seen[0][0].term.value).toBe("Elevated");
    expect(seen[0][0].previous!.value).toBe("Normal");
    const chip = el.querySelector<HTMLElement>('.ui-scxb__chip[data-id="posture"]')!;
    expect(chip.hasAttribute("data-flash")).toBe(true);
    expect(chip.getAnimations().length).toBeGreaterThan(0);
    expect(el.querySelector('.ui-scxb__chip[data-id="intent"]')!.hasAttribute("data-flash")).toBe(false);
    // The same list again changes nothing
    el.terms = [...el.terms];
    await settle();
    expect(seen).toHaveLength(1);
    // A removed term is announced
    el.terms = el.terms.filter((t) => t.id !== "deadline");
    await settle();
    expect(said(el)).toBe("Deadline removed.");
  });

  test("reduced motion: no flash, but the change is still announced", async () => {
    const real = window.matchMedia.bind(window);
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => (q.includes("prefers-reduced-motion") ? ({ matches: true, media: q } as MediaQueryList) : real(q)));
    const el = await make(1800);
    el.terms = TERMS.map((t) => (t.id === "posture" ? { ...t, value: "Elevated" } : t));
    await settle();
    expect(el.querySelector('.ui-scxb__chip[data-id="posture"]')!.hasAttribute("data-flash")).toBe(false);
    expect(said(el)).toBe("Posture: Elevated.");
  });

  test("a changed term behind +N more flashes the button", async () => {
    const el = await make(1800);
    el.maxVisible = 2;
    await frames();
    el.terms = TERMS.map((t) => (t.id === "deadline" ? { ...t, value: "Thu 12:00" } : t));
    await settle();
    expect(more(el).hasAttribute("data-flash")).toBe(true);
    expect(said(el)).toBe("Deadline: Thu 12:00.");
  });

  test("the flash goes after its duration", async () => {
    const el = await make(1800);
    el.style.setProperty("--tc-duration-shimmer", "40ms");
    el.terms = TERMS.map((t) => (t.id === "scope" ? { ...t, value: "Whole company" } : t));
    await settle();
    expect(el.querySelector('.ui-scxb__chip[data-id="scope"]')!.hasAttribute("data-flash")).toBe(true);
    await new Promise((r) => setTimeout(r, 120));
    await settle();
    expect(el.querySelector('.ui-scxb__chip[data-id="scope"]')!.hasAttribute("data-flash")).toBe(false);
  });

  test("an empty bar says so", async () => {
    const el = await make(800, []);
    expect(text(el.querySelector(".ui-scxb__empty"))).toBe("No terms declared for this session");
    expect(el.querySelector(".ui-scxb__more")).toBeNull();
  });

  test("clean: plain text between hairlines", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 1800px"><tc-session-context-bar look="clean" .terms=${TERMS}></tc-session-context-bar></div>`);
    const el = wrap.firstElementChild as TcSessionContextBar;
    expect(el.dataset.look).toBe("clean");
    expect(getComputedStyle(el.querySelector(".ui-scxb__label")!).textTransform).toBe("none");
  });

  test("React: onEdit and onTermsChanged fire; new terms update the chips", async () => {
    const host = document.createElement("div");
    host.style.width = "1800px";
    document.body.append(host);
    const root = createRoot(host);
    const edits: string[] = [];
    const changes: string[] = [];
    let set: (t: SessionTerm[]) => void = () => {};
    function App() {
      const [terms, setTerms] = React.useState(TERMS);
      set = setTerms;
      return React.createElement(SessionContextBar, {
        terms,
        label: "Declared terms",
        onEdit: (t: SessionTerm, anchor: HTMLElement) => edits.push(`${t.id}:${anchor.tagName}`),
        onTermsChanged: (c: SessionTermChange[]) => changes.push(...c.map((x) => x.term.id)),
      } as React.ComponentProps<typeof SessionContextBar>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcSessionContextBar>("tc-session-context-bar")!;
    expect(el.getAttribute("aria-label")).toBe("Declared terms");
    await act(async () => el.querySelector<HTMLButtonElement>('.ui-scxb__chip[data-id="posture"]')!.click());
    expect(edits).toEqual(["posture:BUTTON"]);
    await act(async () => set(TERMS.map((t) => (t.id === "posture" ? { ...t, value: "Elevated" } : t))));
    await settle();
    expect(changes).toEqual(["posture"]);
    expect(text(el.querySelector('.ui-scxb__chip[data-id="posture"] .ui-scxb__value'))).toBe("Elevated");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"])
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="background: ${theme === "dark" ? "#0e0e10" : "#fff"}; padding: 8px; width: 900px; display: grid; gap: 8px">
        <tc-session-context-bar .terms=${TERMS} label="Standard terms"></tc-session-context-bar>
        <tc-session-context-bar look="clean" editable label="Clean terms" .terms=${TERMS}></tc-session-context-bar>
        <tc-session-context-bar look="clean" locked label="Locked terms" .terms=${TERMS.slice(0, 2)}></tc-session-context-bar>
      </div>`);
      await frames();
      const [first] = [...wrap.querySelectorAll<TcSessionContextBar>("tc-session-context-bar")];
      first.maxVisible = 3;
      await frames();
      more(first).click();
      await settle();
      await Promise.all(document.getAnimations().map((x) => (x.finish(), x.finished)));
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
});
