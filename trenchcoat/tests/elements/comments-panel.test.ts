/*
 * <tc-comments-panel> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/comments-panel";
import type { PanelComment, TcCommentsPanel } from "../../src/elements/comments-panel";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const comments: PanelComment[] = [{ id: "e1", author: { name: "Mia Chen" }, createdAt: 0, text: "/edit tighten the intro" }];
const question: PanelComment = { id: "q1", author: { name: "Ann" }, createdAt: 1000, text: "Is this final?" };
const you = { name: "You" };
const buttons = (el: Element, name: RegExp) => [...el.querySelectorAll<HTMLElement>("button")].filter((b) => name.test(b.getAttribute("aria-label") ?? b.textContent!.trim()));
const button = (el: Element, name: RegExp) => buttons(el, name)[0];
const runEdit = (el: Element) => button(el, /Run edit/);
const texts = (el: Element) => [...el.querySelectorAll(".ui-cp__text")].map((p) => p.textContent!.trim());
const fakeTimers = () => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
const advance = async (ms: number) => {
  for (let t = 0; t < ms; t += 100) {
    vi.advanceTimersByTime(100);
    await settle();
  }
};
const flush = async () => {
  for (let i = 0; i < 3; i++) await Promise.resolve();
  await settle();
};
async function write(el: TcCommentsPanel, text: string) {
  const field = el.querySelector<HTMLInputElement>(".ui-cp__input")!;
  field.value = text;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
  button(el, /Send comment/).click();
  await settle();
}
const warnings = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([m]) => String(m).startsWith("CommentsPanel:"));

// Runs first: the warning is once per page, so a later test would find it already spent
test("simulated edits: silent with demo, otherwise one warning per page", async () => {
  fakeTimers();
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const demo = await fixture<TcCommentsPanel>(html`<tc-comments-panel demo .comments=${comments} .currentUser=${you}></tc-comments-panel>`);
  runEdit(demo).click();
  await advance(1200);
  expect(warnings(warn)).toHaveLength(0);
  // Nothing reached the app, so the simulated edit may be undone
  expect(button(demo, /^Undo$/)).toBeTruthy();
  cleanup();
  const wrap = await fixture(html`<div>
    <tc-comments-panel .comments=${comments} .currentUser=${you}></tc-comments-panel>
    <tc-comments-panel look="clean" .comments=${comments} .currentUser=${you}></tc-comments-panel>
  </div>`);
  for (const b of buttons(wrap, /Run edit/)) b.click();
  await advance(1200);
  expect(warnings(warn)).toHaveLength(1);
});

for (const look of ["standard", "clean"] as const) {
  describe(`tc-comments-panel (${look})`, () => {
    test("the host is the root and the region, named by the heading; page attributes stay on it", async () => {
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} class="mine" data-x="1" .comments=${[question]} .currentUser=${you}></tc-comments-panel>`);
      expect(el.dataset.ui).toBe("cp");
      expect(el.dataset.look).toBe(look);
      expect(el.classList.contains("mine")).toBe(true);
      expect(el.dataset.x).toBe("1");
      expect(el.getAttribute("role")).toBe("region");
      expect(el.getAttribute("aria-label")).toBe("Comments");
      el.heading = "Notes";
      el.closable = true;
      await settle();
      expect(el.getAttribute("aria-label")).toBe("Notes");
      const close = vi.fn();
      el.addEventListener("tc-close", close);
      button(el, /^Close notes$/).click();
      expect(close).toHaveBeenCalledTimes(1);
    });

    test("an edit applied through onRunEdit offers no Undo without onUndoEdit", async () => {
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} .comments=${comments} .currentUser=${you} .onRunEdit=${vi.fn(() => Promise.resolve())}></tc-comments-panel>`);
      runEdit(el).click();
      await flush();
      expect(el.querySelector(".ui-cp__done")!.textContent).toBe("Edit applied");
      expect(button(el, /^Undo$/)).toBeUndefined();
    });

    test("Undo calls onUndoEdit with the comment and reopens the edit", async () => {
      const onUndoEdit = vi.fn(() => Promise.resolve());
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} .comments=${comments} .currentUser=${you} .onRunEdit=${() => Promise.resolve()} .onUndoEdit=${onUndoEdit}></tc-comments-panel>`);
      runEdit(el).click();
      await flush();
      button(el, /^Undo$/).click();
      await flush();
      expect(onUndoEdit).toHaveBeenCalledWith(comments[0]);
      expect(runEdit(el)).toBeTruthy();
    });

    test("a rejected onUndoEdit keeps the edit applied and says so", async () => {
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} .comments=${comments} .currentUser=${you} .onRunEdit=${() => Promise.resolve()} .onUndoEdit=${() => Promise.reject(new Error("x"))}></tc-comments-panel>`);
      runEdit(el).click();
      await flush();
      button(el, /^Undo$/).click();
      await flush();
      expect(el.querySelector(".ui-cp__done")).toBeTruthy();
      expect(el.querySelector("[role=alert]")!.textContent).toMatch(/couldn't be undone/);
    });

    test("a rejected onRunEdit shows an error and the edit can run again", async () => {
      const onRunEdit = vi.fn<() => Promise<void>>().mockRejectedValueOnce(new Error("conflict")).mockResolvedValue();
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} .comments=${comments} .currentUser=${you} .onRunEdit=${onRunEdit}></tc-comments-panel>`);
      runEdit(el).click();
      await flush();
      expect(el.querySelector(".ui-cp__done")).toBeNull();
      expect(el.querySelector("[role=alert]")!.textContent).toMatch(/couldn't be applied/);
      expect(runEdit(el).hasAttribute("aria-disabled")).toBe(false);
      runEdit(el).click();
      await flush();
      expect(el.querySelector(".ui-cp__done")).toBeTruthy();
      expect(el.querySelector("[role=alert]")).toBeNull();
    });

    test("later comments from the app show, newest first", async () => {
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} demo .comments=${[question]} .currentUser=${you}></tc-comments-panel>`);
      el.comments = [question, { ...question, id: "q2", createdAt: 2000, text: "And this?" }];
      await settle();
      expect(texts(el)).toEqual(["And this?", "Is this final?"]);
    });

    test("an added comment is reported; passed back it isn't doubled", async () => {
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} demo .comments=${[question]} .currentUser=${you}></tc-comments-panel>`);
      const changes: PanelComment[][] = [];
      el.addEventListener("tc-comments-change", (e) => changes.push((e as CustomEvent).detail.comments));
      await write(el, "Yes, final.");
      expect(changes[0].map((c) => c.text)).toEqual(["Yes, final.", "Is this final?"]);
      el.comments = changes[0];
      await settle();
      expect(texts(el).filter((t) => t === "Yes, final.")).toHaveLength(1);
    });

    test("a prevented change keeps the added comment out", async () => {
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} demo .comments=${[question]} .currentUser=${you}></tc-comments-panel>`);
      el.addEventListener("tc-comments-change", (e) => e.preventDefault());
      await write(el, "Mine");
      expect(texts(el)).toEqual(["Is this final?"]);
    });

    test("a rejected onAdd takes the comment out, gives the text back and says so", async () => {
      let fail!: () => void;
      const onAdd = vi.fn(() => new Promise<void>((_, reject) => (fail = () => reject(new Error("offline")))));
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} demo .comments=${[question]} .currentUser=${you} .onAdd=${onAdd}></tc-comments-panel>`);
      const changes: PanelComment[][] = [];
      el.addEventListener("tc-comments-change", (e) => changes.push((e as CustomEvent).detail.comments));
      await write(el, "Yes, final.");
      expect(el.querySelector(".ui-cp__item[aria-busy]")?.textContent).toContain("Yes, final.");
      fail();
      await flush();
      expect(texts(el)).toEqual(["Is this final?"]);
      expect(el.querySelector("[role=alert]")!.textContent).toMatch(/couldn't be added/);
      expect(el.querySelector<HTMLInputElement>(".ui-cp__input")!.value).toBe("Yes, final.");
      expect(changes[changes.length - 1]).toEqual([question]);
    });

    test("controlled resolved and filter: prevented clicks are reported, not applied; properties show", async () => {
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} demo .comments=${[question]} .currentUser=${you}></tc-comments-panel>`);
      const resolved = vi.fn();
      const filter = vi.fn();
      el.addEventListener("tc-resolved-change", (e) => (e.preventDefault(), resolved((e as CustomEvent).detail.resolved)));
      el.addEventListener("tc-filter-change", (e) => (e.preventDefault(), filter((e as CustomEvent).detail.filter)));
      button(el, /^Resolve comment$/).click();
      await settle();
      expect(resolved).toHaveBeenCalledWith(["q1"]);
      expect(button(el, /^Resolve comment$/).getAttribute("aria-pressed")).toBe("false");
      button(el, /^Questions/).click();
      await settle();
      expect(filter).toHaveBeenCalledWith("questions");
      expect(button(el, /^All/).getAttribute("aria-pressed")).toBe("true");
      el.resolved = ["q1"];
      el.filter = "questions";
      await settle();
      expect(el.querySelector('.ui-cp__resolve[aria-pressed="true"]')).toBeTruthy();
      expect(button(el, /^Questions/).getAttribute("aria-pressed")).toBe("true");
    });

    test("uncontrolled: resolving applies and is reported", async () => {
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} demo .comments=${[question]} .currentUser=${you}></tc-comments-panel>`);
      const resolved = vi.fn();
      el.addEventListener("tc-resolved-change", (e) => resolved((e as CustomEvent).detail.resolved));
      button(el, /^Resolve comment$/).click();
      await settle();
      expect(resolved).toHaveBeenCalledWith(["q1"]);
      expect(button(el, /^Reopen comment$/).getAttribute("aria-pressed")).toBe("true");
    });
  });

  /*
   * WCAG pass: filters are toggle buttons (no half tab pattern), the sort menu follows the menu-button pattern, Run
   * edit ↔ Undo keep focus, the feed isn't one big live region and a persistent status region announces results.
   */
  describe(`tc-comments-panel a11y (${look})`, () => {
    test("filters are toggle buttons, not tabs without panels", async () => {
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} demo .comments=${comments} .currentUser=${you}></tc-comments-panel>`);
      expect(el.querySelectorAll("[role=tab]")).toHaveLength(0);
      expect(el.querySelector('[role=group][aria-label="Filter comments"]')).toBeTruthy();
      const questions = button(el, /^Questions/);
      questions.click();
      await settle();
      expect(questions.getAttribute("aria-pressed")).toBe("true");
      expect(el.querySelector(".ui-cp__empty")!.textContent).toBe("No open questions.");
    });

    test("sort menu: focus moves in, arrows move, Esc and picking return focus to the trigger, Tab closes", async () => {
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} demo .comments=${comments} .currentUser=${you}></tc-comments-panel>`);
      const key = (t: Element, k: string) => t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
      const trigger = button(el, /^Sort comments$/);
      const items = () => [...el.querySelectorAll<HTMLElement>("[role=menuitemradio]")];
      trigger.click();
      await settle();
      expect(document.activeElement).toBe(items()[0]);
      key(items()[0], "ArrowDown");
      await settle();
      expect(document.activeElement).toBe(items()[1]);
      key(items()[1], "Escape");
      await settle();
      expect(el.querySelector("[role=menu]")).toBeNull();
      expect(document.activeElement).toBe(trigger);
      key(trigger, "ArrowDown");
      await settle();
      items()[1].click();
      await settle();
      expect(el.querySelector("[role=menu]")).toBeNull();
      expect(document.activeElement).toBe(trigger);
      trigger.click();
      await settle();
      expect(items()[1].getAttribute("aria-checked")).toBe("true");
      key(items()[1], "Tab");
      await settle();
      expect(el.querySelector("[role=menu]")).toBeNull();
    });

    test("Run edit keeps focus while running, then Undo; Undo hands it back to Run edit", async () => {
      fakeTimers();
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} demo .comments=${comments} .currentUser=${you}></tc-comments-panel>`);
      const run = runEdit(el);
      run.focus();
      run.click();
      await settle();
      expect(run.getAttribute("aria-disabled")).toBe("true");
      expect(document.activeElement).toBe(run);
      await advance(1200);
      const undo = button(el, /^Undo$/);
      expect(document.activeElement).toBe(undo);
      undo.click();
      await advance(100);
      expect(document.activeElement).toBe(runEdit(el));
    });

    test("the list isn't a live region; a status region present from the start announces results", async () => {
      fakeTimers();
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} demo .comments=${comments} .currentUser=${you}></tc-comments-panel>`);
      expect(el.querySelector("[aria-live]")).toBeNull();
      const status = el.querySelector("[role=status]")!;
      expect(status.textContent).toBe("");
      runEdit(el).click();
      await advance(1200);
      expect(status.textContent).toBe("Edit applied.");
    });

    test("sending with the button hands focus back to the field", async () => {
      const el = await fixture<TcCommentsPanel>(html`<tc-comments-panel look=${look} demo .comments=${comments} .currentUser=${you}></tc-comments-panel>`);
      const field = el.querySelector<HTMLInputElement>(".ui-cp__input")!;
      field.value = "Hi";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      await settle();
      const send = button(el, /^Send comment$/);
      send.focus();
      send.click();
      await settle();
      expect(document.activeElement).toBe(field);
    });
  });
}

test("axe: no violations in either look", async () => {
  const wrap = await fixture(html`<div>
    <tc-comments-panel demo closable .comments=${[question, ...comments]} .currentUser=${you}></tc-comments-panel>
    <tc-comments-panel look="clean" heading="Clean" demo closable .comments=${[question, ...comments]} .currentUser=${you}></tc-comments-panel>
  </div>`);
  for (const a of document.getAnimations()) a.finish();
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
