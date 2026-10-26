/*
 * <tc-memory-panel> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/memory-panel";
import { TcMemoryPanel, type Memory } from "../../src/elements/memory-panel";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const tea: Memory = { id: "a", text: "Likes tea", category: "Preferences" };
const berlin: Memory = { id: "b", text: "Works in Berlin", category: "Work" };
const texts = (el: Element) => [...el.querySelectorAll(".ui-mp__text")].map((p) => p.textContent);
const button = (el: Element, name: string) => [...el.querySelectorAll<HTMLElement>("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === name);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-memory="${id}"]`)!;
const fakeTimers = () => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
const advance = async (ms: number) => {
  for (let t = 0; t < ms; t += 100) {
    vi.advanceTimersByTime(Math.min(100, ms - t));
    await settle();
  }
};
const flush = async () => {
  for (let i = 0; i < 3; i++) await Promise.resolve();
  await settle();
};
const key = (t: Element, k: string, init: KeyboardEventInit = {}) => t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));

for (const look of ["standard", "clean"] as const) {
  describe(`tc-memory-panel (${look})`, () => {
    test("the host is the root and the group, named by the heading; page attributes stay on it", async () => {
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} class="mine" data-x="1" max-height="200" .memories=${[tea]}></tc-memory-panel>`);
      expect(el.dataset.ui).toBe("mp");
      expect(el.dataset.look).toBe(look);
      expect(el.classList.contains("mine")).toBe(true);
      expect(el.dataset.x).toBe("1");
      expect(el.getAttribute("role")).toBe("group");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Memory");
      expect(el.style.getPropertyValue("--tc-memory-panel-max")).toBe("200px");
    });

    test("memories and enabled follow their properties", async () => {
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea]}></tc-memory-panel>`);
      expect(texts(el)).toEqual(["Likes tea"]);
      el.memories = [berlin, { ...tea, id: "c", text: "Uses metric units" }];
      el.enabled = false;
      await settle();
      expect(texts(el).sort()).toEqual(["Uses metric units", "Works in Berlin"]);
      expect(row(el, "b").closest("section")!.getAttribute("aria-label")).toBe("Work");
      expect(el.querySelector('[role="switch"]')!.getAttribute("aria-checked")).toBe("false");
      expect(el.hasAttribute("data-off")).toBe(true);
    });

    test("uncontrolled: a change applies and is reported", async () => {
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea, berlin]}></tc-memory-panel>`);
      const changes = vi.fn();
      el.addEventListener("tc-memories-change", (e) => changes((e as CustomEvent).detail.memories));
      button(el, "Pause “Likes tea”")!.click();
      await settle();
      expect(changes).toHaveBeenLastCalledWith([{ ...tea, paused: true }, berlin]);
      expect(row(el, "a").hasAttribute("data-paused")).toBe(true);
    });

    test("controlled: a prevented change is reported, not applied", async () => {
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea]}></tc-memory-panel>`);
      const changes = vi.fn();
      el.addEventListener("tc-memories-change", (e) => {
        e.preventDefault();
        changes((e as CustomEvent).detail.memories);
      });
      button(el, "Pause “Likes tea”")!.click();
      await settle();
      expect(changes).toHaveBeenCalledWith([{ ...tea, paused: true }]);
      expect(row(el, "a").hasAttribute("data-paused")).toBe(false);
    });

    test("the switch fires tc-enabled-change and unfolds the note", async () => {
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea]}></tc-memory-panel>`);
      const changes = vi.fn();
      el.addEventListener("tc-enabled-change", (e) => changes((e as CustomEvent).detail.enabled));
      el.querySelector<HTMLElement>('[role="switch"]')!.click();
      await settle();
      expect(changes).toHaveBeenCalledWith(false);
      expect(el.querySelector(`[id="${el.querySelector('[role="switch"]')!.getAttribute("aria-controls")}"]`)!.hasAttribute("data-open")).toBe(true);
      expect(el.querySelector(".ui-mp__caption")!.textContent).toContain("Memory is off");
    });

    test("a rejected onPause rolls the change back and says so", async () => {
      let fail!: (e: Error) => void;
      const onPause = vi.fn(() => new Promise((_, reject) => (fail = reject)));
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea]} .onPause=${onPause}></tc-memory-panel>`);
      button(el, "Pause “Likes tea”")!.click();
      await settle();
      expect(row(el, "a").hasAttribute("data-paused")).toBe(true);
      expect(row(el, "a").getAttribute("aria-busy")).toBe("true");
      fail(new Error("offline"));
      await flush();
      expect(row(el, "a").hasAttribute("data-paused")).toBe(false);
      expect(row(el, "a").hasAttribute("aria-busy")).toBe(false);
      expect(el.querySelector(".ui-mp__caption")!.textContent).toMatch(/Couldn't pause it/);
    });

    test("a rejected onForget brings the memory back", async () => {
      fakeTimers();
      const onForget = vi.fn(() => Promise.reject(new Error("offline")));
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea, berlin]} .onForget=${onForget}></tc-memory-panel>`);
      button(el, "Forget “Likes tea”")!.click();
      await advance(400);
      await flush();
      expect(onForget).toHaveBeenCalledWith("a");
      expect(texts(el).sort()).toEqual(["Likes tea", "Works in Berlin"]);
      expect(el.querySelector(".ui-mp__caption")!.textContent).toMatch(/Couldn't forget it/);
    });

    test("Enter while composing (IME) doesn't save a new memory", async () => {
      const onAdd = vi.fn();
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea]} .onAdd=${onAdd}></tc-memory-panel>`);
      button(el, "New memory")!.click();
      await settle();
      const box = el.querySelector<HTMLTextAreaElement>('textarea[aria-label="New memory"]')!;
      expect(document.activeElement).toBe(box);
      box.value = "日本語";
      box.dispatchEvent(new Event("input", { bubbles: true }));
      await settle();
      key(box, "Enter", { isComposing: true });
      expect(onAdd).not.toHaveBeenCalled();
      key(box, "Enter");
      await settle();
      expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ text: "日本語", category: "Preferences", source: "You added" }));
      expect(texts(el)).toContain("日本語");
    });

    test("editing in place saves with Enter and is reported to onEdit", async () => {
      const onEdit = vi.fn();
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea]} .onEdit=${onEdit}></tc-memory-panel>`);
      button(el, "Edit “Likes tea”")!.click();
      await settle();
      const box = el.querySelector<HTMLTextAreaElement>('textarea[aria-label="Edit memory"]')!;
      expect(document.activeElement).toBe(box);
      box.value = "Likes green tea";
      box.dispatchEvent(new Event("input", { bubbles: true }));
      key(box, "Enter");
      await settle();
      expect(onEdit).toHaveBeenCalledWith("a", "Likes green tea");
      expect(texts(el)).toEqual(["Likes green tea"]);
    });

    test("category chips filter the list and move with the arrow keys", async () => {
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea, berlin]}></tc-memory-panel>`);
      const radios = () => [...el.querySelectorAll<HTMLElement>('.ui-mp__chips [role="radio"]')];
      expect(radios().map((r) => r.textContent)).toEqual(["All2", "Preferences1", "Work1"]);
      radios()[0].focus();
      key(radios()[0], "ArrowRight");
      await settle();
      expect(radios()[1].getAttribute("aria-checked")).toBe("true");
      expect(document.activeElement).toBe(radios()[1]);
      expect(row(el, "b").closest("section")!.hasAttribute("data-open")).toBe(false);
      expect(row(el, "a").closest("section")!.hasAttribute("data-open")).toBe(true);
    });

    test("rolling counts don't re-render every frame", async () => {
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea, berlin]}></tc-memory-panel>`);
      const updates = vi.spyOn(TcMemoryPanel.prototype as unknown as { update: (c: unknown) => void }, "update");
      button(el, "Pause “Likes tea”")!.click();
      for (let i = 0; i < 40; i++) await new Promise((r) => requestAnimationFrame(r));
      expect(updates.mock.calls.length).toBeLessThanOrEqual(5);
      expect(el.querySelector('[class*="__caption"]')!.textContent).toContain("2 memories · 1 paused");
    });
  });

  /* WCAG: Forget made the focused row inert (2.4.3); Undo expired whatever you did (2.2.1); the caption was live (4.1.3) */
  describe(`tc-memory-panel (${look}) – focus, timing, announcements`, () => {
    test("Forget moves focus to the next memory's Forget before the row folds", async () => {
      fakeTimers();
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea, berlin]}></tc-memory-panel>`);
      const forget = button(el, "Forget “Likes tea”")!;
      forget.focus();
      forget.click();
      expect(document.activeElement).toBe(button(el, "Forget “Works in Berlin”"));
      await advance(400);
      expect(document.activeElement).toBe(button(el, "Forget “Works in Berlin”"));
    });

    test("forgetting the last memory moves focus to New memory, not <body>", async () => {
      fakeTimers();
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea]}></tc-memory-panel>`);
      const forget = button(el, "Forget “Likes tea”")!;
      forget.focus();
      forget.click();
      await advance(400);
      expect(document.activeElement).toBe(el.querySelector(".ui-mp__add"));
    });

    test("Undo waits while focus is on it and starts its full time over after; Undo brings the memory back", async () => {
      fakeTimers();
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} undo-for="1000" .memories=${[tea, berlin]}></tc-memory-panel>`);
      button(el, "Forget “Likes tea”")!.click();
      await advance(400);
      const undo = button(el, "Undo")!;
      undo.focus();
      await advance(3000);
      expect(button(el, "Undo")).toBe(undo);
      el.querySelector<HTMLElement>(".ui-mp__add")!.focus();
      await advance(600);
      expect(button(el, "Undo")).toBeTruthy();
      await advance(600);
      expect(button(el, "Undo")).toBeUndefined();
      // Again, and this time Undo
      const restore = vi.fn();
      el.onRestore = restore;
      button(el, "Forget “Works in Berlin”")!.click();
      await advance(400);
      button(el, "Undo")!.click();
      await settle();
      expect(restore).toHaveBeenCalledWith(berlin);
      expect(texts(el)).toEqual(["Works in Berlin"]);
    });

    test("undo-for Infinity keeps Undo; the status region says what was forgotten", async () => {
      fakeTimers();
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .undoFor=${Infinity} .memories=${[tea, berlin]}></tc-memory-panel>`);
      const region = el.querySelector('[role="status"]')!;
      expect(region.textContent).toBe("");
      expect(el.querySelector("[aria-live]")).toBeNull();
      button(el, "Forget “Likes tea”")!.click();
      await advance(10_000);
      expect(button(el, "Undo")).toBeTruthy();
      expect(region.textContent).toBe("Forgot “Likes tea”. Undo is on the tray.");
    });

    test("search: opens with focus in the field, filters, Esc closes back to the button", async () => {
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea, berlin]}></tc-memory-panel>`);
      const open = el.querySelector<HTMLElement>(".ui-mp__search-open")!;
      open.click();
      await settle();
      const field = el.querySelector<HTMLInputElement>(".ui-mp__search .ui-mp__input")!;
      expect(document.activeElement).toBe(field);
      field.value = "zzz";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      await settle();
      expect(el.querySelector(".ui-mp__empty")!.textContent).toBe("No memory mentions “zzz”");
      key(field, "Escape");
      await settle();
      await new Promise((r) => requestAnimationFrame(r));
      expect(document.activeElement).toBe(open);
    });
  });
}

test("axe: no violations in either look", async () => {
  const wrap = await fixture(html`<div>
    <tc-memory-panel action-label="Manage" .memories=${[tea, { ...berlin, paused: true }]}></tc-memory-panel>
    <tc-memory-panel look="clean" heading="Clean" action-label="Manage" .memories=${[tea, { ...berlin, paused: true }]}></tc-memory-panel>
  </div>`);
  for (const a of document.getAnimations()) a.finish();
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
