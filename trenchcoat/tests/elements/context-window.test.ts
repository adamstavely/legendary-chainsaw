/*
 * <tc-context-window> in real browsers – the React component's contract and regression checks, ported. Timers run
 * for real here (the compaction's shimmer is 1.3 s, a removal folds for 240 ms).
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/context-window";
import { TcContextWindow, type ContextPart } from "../../src/elements/context-window";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const parts: ContextPart[] = [
  { id: "sys", label: "System prompt", tokens: 2000, locked: true },
  { id: "chat", label: "Conversation", tokens: 40000, compact: true },
];
const mixed: ContextPart[] = [
  { id: "files", label: "Files", items: ["a.ts", "b.ts"].map((id) => ({ id, label: id, tokens: 1000 })), compact: true },
  { id: "chat", label: "Conversation", tokens: 40000, compact: true },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const button = (el: Element, name: string | RegExp) =>
  [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => {
    const n = b.getAttribute("aria-label") ?? b.textContent!.trim();
    return typeof name === "string" ? n === name : name.test(n);
  }) ?? null;
const status = (el: Element) => el.querySelector('[role="status"]')!;
/** Waits until `check` passes (or fails after `ms`) */
const until = async (check: () => void, ms = 3000) => {
  const end = performance.now() + ms;
  for (;;) {
    try {
      check();
      return;
    } catch (e) {
      if (performance.now() > end) throw e;
      await sleep(50);
      await settle();
    }
  }
};

for (const look of ["standard", "clean"] as const) {
  describe(`tc-context-window ${look}`, () => {
    test("the host is the root and the group, named by the heading; it carries the level", async () => {
      const el = await fixture<TcContextWindow>(html`<tc-context-window look=${look} model="Opus" .parts=${parts} .limit=${128000}></tc-context-window>`);
      expect(el.dataset.ui).toBe("cw");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("group");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Context window");
      expect(el.dataset.level).toBe("ok");
      expect(el.querySelector(".ui-cw__sr")!.textContent).toBe("42.0K of 128.0K tokens used, 33 percent");
      expect(el.querySelectorAll(".ui-cw__cell")).toHaveLength(216);
      expect(el.querySelectorAll(".ui-cw__cell:not([data-free])")).toHaveLength(71);
      el.parts = [{ id: "chat", label: "Conversation", tokens: 110000 }];
      await settle();
      expect(el.dataset.level).toBe("warn");
      expect(status(el).textContent).toBe("Context window is almost full");
    });

    test("parts stay the source of truth: new parts show as soon as they're passed", async () => {
      const el = await fixture<TcContextWindow>(html`<tc-context-window look=${look} .parts=${parts.slice(0, 1)} .limit=${128000}></tc-context-window>`);
      expect(el.querySelectorAll(".ui-cw__part")).toHaveLength(1);
      el.parts = parts;
      await settle();
      expect(el.querySelectorAll(".ui-cw__part")).toHaveLength(2);
    });

    test("a rejected onCompact leaves the part uncompacted, says so, and can be retried", async () => {
      const onCompact = vi.fn().mockRejectedValueOnce(new Error("quota")).mockResolvedValue(undefined);
      const el = await fixture<TcContextWindow>(html`<tc-context-window look=${look} .parts=${parts} .limit=${128000} .onCompact=${onCompact}></tc-context-window>`);
      button(el, "Compact Conversation")!.click();
      await until(() => expect(status(el).textContent).toMatch(/Couldn't compact Conversation/));
      expect(onCompact).toHaveBeenCalledWith("chat", expect.objectContaining({ signal: expect.any(AbortSignal) }));
      const again = button(el, "Compact Conversation")!;
      expect(again.getAttribute("aria-disabled")).toBeNull();
      again.click();
      await until(() => expect(button(el, "Conversation is compacted")).toBeTruthy());
      expect(onCompact).toHaveBeenCalledTimes(2);
      expect(el.textContent).not.toMatch(/Couldn't compact/);
    });

    test("removing an item fires tc-remove-item; a listener alone doesn't freeze it; new items from the parent show again", async () => {
      const files = (ids: string[]): ContextPart[] => [{ id: "files", label: "Files", items: ids.map((id) => ({ id, label: id, tokens: 1000 })) }];
      const removed: unknown[] = [];
      const el = await fixture<TcContextWindow>(html`<tc-context-window look=${look} .parts=${files(["a.ts", "b.ts"])} .limit=${128000} @tc-remove-item=${(e: CustomEvent) => removed.push(e.detail)}></tc-context-window>`);
      button(el, "Remove a.ts")!.click();
      await until(() => expect(removed).toEqual([{ partId: "files", itemId: "a.ts" }]));
      await settle();
      expect(button(el, "Remove a.ts")).toBeNull();
      // Same items again (a re-render that didn't handle it): still hidden
      el.parts = files(["a.ts", "b.ts"]);
      await settle();
      expect(button(el, "Remove a.ts")).toBeNull();
      // The parent's list changed: it is the source of truth again
      el.parts = files(["a.ts", "b.ts", "c.ts"]);
      await settle();
      expect(button(el, "Remove a.ts")).toBeTruthy();
    });

    test("a compaction shrinks the part until the parent passes its own size", async () => {
      const onCompact = vi.fn().mockResolvedValue(undefined);
      const chat = (tokens: number): ContextPart[] => [{ id: "chat", label: "Conversation", tokens, compact: 0.5 }];
      const el = await fixture<TcContextWindow>(html`<tc-context-window look=${look} .parts=${chat(40000)} .limit=${128000} .onCompact=${onCompact}></tc-context-window>`);
      button(el, "Compact Conversation")!.click();
      await until(() => expect(el.querySelector(".ui-cw__sr")!.textContent).toMatch(/^20\.0K of/));
      el.parts = chat(12000);
      await settle();
      expect(el.querySelector(".ui-cw__sr")!.textContent).toMatch(/^12\.0K of/);
    });

    test("a compaction running when the element is removed is aborted", async () => {
      let signal: AbortSignal | undefined;
      const onCompact = (_id: string, o: { signal: AbortSignal }) => {
        signal = o.signal;
        return new Promise<void>(() => {});
      };
      const el = await fixture<TcContextWindow>(html`<tc-context-window look=${look} .parts=${parts} .limit=${128000} .onCompact=${onCompact}></tc-context-window>`);
      button(el, "Compact Conversation")!.click();
      await sleep(50);
      expect(signal?.aborted).toBe(false);
      el.remove();
      expect(signal?.aborted).toBe(true);
    });

    test("no button inside a button; the part's button is named by its label and opens its items", async () => {
      const el = await fixture<TcContextWindow>(html`<tc-context-window look=${look} .parts=${mixed} .limit=${128000}></tc-context-window>`);
      expect(el.querySelector("button button")).toBeNull();
      const toggle = button(el, "Files")!;
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(toggle.contains(button(el, "Compact Files"))).toBe(false);
      const fold = document.getElementById(toggle.getAttribute("aria-controls")!)!;
      expect(fold.hasAttribute("inert")).toBe(true);
      toggle.click();
      await settle();
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
      expect(fold.hasAttribute("inert")).toBe(false);
    });

    test("a status region is there from mount; the hover caption is not live", async () => {
      const el = await fixture<TcContextWindow>(html`<tc-context-window look=${look} .parts=${mixed} .limit=${128000}></tc-context-window>`);
      expect(el.querySelector("[aria-live]")).toBeNull();
      expect(status(el).textContent).toBe("");
      el.querySelector(".ui-cw__part")!.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
      await settle();
      expect(el.querySelector(".ui-cw__caption")!.textContent).toMatch(/Files/);
      expect(el.querySelector(".ui-cw__part[data-hot]")).toBeTruthy();
      expect(el.querySelector(".ui-cw__part[data-dim]")).toBeTruthy();
      expect(status(el).textContent).toBe("");
      el.dispatchEvent(new PointerEvent("pointerleave"));
      await settle();
      expect(el.querySelector(".ui-cw__part[data-hot]")).toBeNull();
    });

    test("Compact keeps focus while it works; when it folds away focus moves on, not to <body>", async () => {
      const onCompact = vi.fn().mockResolvedValue(undefined);
      const actions: unknown[] = [];
      const el = await fixture<TcContextWindow>(html`<tc-context-window look=${look} .parts=${parts} .limit=${128000} .onCompact=${onCompact} action-label="New chat" @tc-action=${(e: CustomEvent) => actions.push(e.detail)}></tc-context-window>`);
      const b = button(el, "Compact Conversation")!;
      b.focus();
      b.click();
      await settle();
      expect(b.getAttribute("aria-disabled")).toBe("true");
      expect(document.activeElement).toBe(b);
      expect(status(el).textContent).toMatch(/Compacting Conversation/);
      await until(() => expect(status(el).textContent).toMatch(/Saved 28K tokens/));
      expect(document.activeElement).toBe(button(el, "Conversation is compacted"));
      await until(() => expect(button(el, /Conversation is compacted/)).toBeNull(), 4000);
      await until(() => expect(document.activeElement).toBe(button(el, "New chat")));
      button(el, "New chat")!.click();
      expect(actions).toEqual([{ label: "New chat" }]);
    });

    test("removing an item moves focus to the next item's ×, then to the part's button", async () => {
      const el = await fixture<TcContextWindow>(html`<tc-context-window look=${look} .parts=${mixed} .limit=${128000}></tc-context-window>`);
      button(el, "Files")!.click();
      await settle();
      const first = button(el, "Remove a.ts")!;
      first.focus();
      first.click();
      await settle();
      expect(document.activeElement).toBe(button(el, "Remove b.ts"));
      expect(first.closest("[inert]")).not.toBeNull();
      expect(status(el).textContent).toBe("Removed a.ts");
      await until(() => expect(button(el, "Remove a.ts")).toBeNull());
      const last = button(el, "Remove b.ts")!;
      last.click();
      await settle();
      expect(document.activeElement).toBe(button(el, "Files"));
    });

    test("a model icon element is cloned next to the model name", async () => {
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("data-mine", "");
      const el = await fixture<TcContextWindow>(html`<tc-context-window look=${look} model="Opus" .modelIcon=${icon} .parts=${parts} .limit=${128000}></tc-context-window>`);
      expect(el.querySelector(".ui-cw__model-icon svg[data-mine]")).toBeTruthy();
      expect(el.querySelector(".ui-cw__model")!.textContent).toBe("Opus");
      expect(icon.isConnected).toBe(false);
    });
  });
}

test("parts that step back keep readable text – no opacity on the row", () => {
  const css = TcContextWindow.css;
  expect(css).not.toMatch(/\.ui-cw__part\[data-dim\] \{[^}]*opacity/);
  expect(css).toMatch(/\.ui-cw__part\[data-dim\] :is\(\.ui-cw__label, \.ui-cw__value\) \{ color: var\(--tc-text-muted/);
});

test("removed, it leaves no timers or frames behind", async () => {
  const onCompact = vi.fn().mockResolvedValue(undefined);
  const el = await fixture<TcContextWindow>(html`<tc-context-window .parts=${mixed} .limit=${128000} .onCompact=${onCompact}></tc-context-window>`);
  const clear = vi.spyOn(window, "clearTimeout");
  button(el, "Compact Conversation")!.click();
  await settle();
  el.remove();
  expect(clear).toHaveBeenCalled();
  clear.mockRestore();
});

test("axe: no violations in either look", async () => {
  const wrap = await fixture(html`<div>
    <tc-context-window model="Opus" action-label="New chat" .parts=${mixed} .limit=${128000}></tc-context-window>
    <tc-context-window look="clean" heading="Clean" action-label="New chat" .parts=${mixed} .limit=${50000}></tc-context-window>
  </div>`);
  for (const a of document.getAnimations()) a.finish();
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
