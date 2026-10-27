/*
 * <tc-review-center> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/review-center";
import type { ReviewItem, TcReviewCenter } from "../../src/elements/review-center";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const item = (id: string, title: string): ReviewItem => ({ id, title, agent: "Support agent", type: "Refund", risk: "medium", confidence: 0.9, createdAt: 0 });
const A = item("a", "Refund order 1");
const B = item("b", "Refund order 2");
const F: ReviewItem = {
  ...item("f", "Reply to Maya"),
  risk: "high",
  confidence: 0.55,
  body: ["Hi Maya, we ", { text: "refunded $40", note: "Amount not confirmed", source: "Stripe" }, " today."],
};
// Rows still in the queue – a leaving row lingers a moment as a ghost
const rows = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-rvc__item:not([data-leaving]) .ui-rvc__row")];
const row = (el: Element, title: string) => rows(el).find((b) => b.querySelector(".ui-rvc__row-title")!.textContent === title) ?? null;
const button = (el: Element, name: RegExp) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => name.test(b.textContent!.trim()))!;
const approve = async (el: Element) => {
  button(el, /^Approve/).click();
  await settle();
};
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const css = () => (customElements.get("tc-review-center") as unknown as { css: string }).css;
const make = (items: ReviewItem[], extra: Partial<TcReviewCenter> = {}) =>
  fixture<TcReviewCenter>(html`<tc-review-center .items=${items} .now=${extra.now ?? 0} .sla=${extra.sla ?? 30 * 60_000} .onDecide=${extra.onDecide} .undoTimeout=${extra.undoTimeout ?? 6000} .shortcuts=${extra.shortcuts ?? true} look=${extra.look ?? "standard"}></tc-review-center>`);

describe("tc-review-center", () => {
  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("the host is the root and its own handle", async () => {
        const el = await make([A, B], { look });
        expect(el.dataset.ui).toBe("rvc");
        expect(el.dataset.look).toBe(look);
        expect(el.tabIndex).toBe(-1);
        for (const m of ["approve", "reject", "edit", "setDraft", "save", "cancel", "skip", "next", "previous", "undo", "peek", "select"] as const) expect(typeof el[m]).toBe("function");
        expect(el.querySelector(".tc-head__title")!.textContent).toBe("Review center");
      });

      test("an id that leaves items and comes back is pending again", async () => {
        const el = await make([A, B], { look });
        await approve(el);
        expect(row(el, "Refund order 1")).toBeNull();
        el.items = [B];
        await settle();
        el.items = [A, B];
        await settle();
        expect(row(el, "Refund order 1")).toBeTruthy();
      });

      test("a decided id that stays in items stays hidden", async () => {
        const el = await make([A, B], { look });
        await approve(el);
        el.items = [{ ...A }, B];
        await settle();
        expect(row(el, "Refund order 1")).toBeNull();
      });

      test("onDecide's promise: pending while it runs, rejected → the item comes back with the error, Try again", async () => {
        let fail!: (e: Error) => void;
        const onDecide = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
        const el = await make([A, B], { look, onDecide });
        await approve(el);
        expect(el.querySelector(".ui-rvc__undo")?.getAttribute("aria-busy")).toBe("true");
        expect(row(el, "Refund order 1")).toBeNull();
        fail(new Error("Network down"));
        await settle();
        const chip = el.querySelector<HTMLElement>(".ui-rvc__undo[data-error]")!;
        expect(el.querySelector('[role="alert"]')).toBeNull();
        expect(el.querySelector("[aria-live]")!.textContent).toContain("Couldn't approve");
        expect(chip.textContent).toContain("Couldn't approve");
        expect(chip.textContent).toContain("Network down");
        expect(row(el, "Refund order 1")!.getAttribute("aria-current")).toBe("true");
        onDecide.mockImplementation(() => Promise.resolve());
        button(chip, /Try again/).click();
        await settle();
        await settle();
        expect(onDecide).toHaveBeenCalledTimes(2);
        expect(row(el, "Refund order 1")).toBeNull();
        expect(el.querySelector(".ui-rvc__undo[data-error]")).toBeNull();
        expect(el.querySelector(".ui-rvc__undo")?.getAttribute("aria-busy")).toBeNull();
      });

      test("a failure after Undo leaves the item alone", async () => {
        let fail!: (e: Error) => void;
        const el = await make([A, B], { look, onDecide: () => new Promise<void>((_, reject) => (fail = reject)) });
        await approve(el);
        button(el, /^Undo/).click();
        await settle();
        fail(new Error("late"));
        await settle();
        expect(el.querySelector(".ui-rvc__undo[data-error]")).toBeNull();
        expect(rows(el)).toHaveLength(2);
      });

      test("nothing changes after disconnect when the promise settles", async () => {
        let fail!: (e: Error) => void;
        const el = await make([A, B], { look, onDecide: () => new Promise<void>((_, r) => (fail = r)) });
        await approve(el);
        el.remove();
        fail(new Error("x"));
        await settle(el);
        expect(el.querySelector(".ui-rvc__undo[data-error]")).toBeNull();
      });

      test("without `now` it reads the clock only after connecting, not while rendering", async () => {
        const spy = vi.spyOn(Date, "now");
        const el = document.createElement("tc-review-center");
        el.items = [A, B];
        expect(spy).not.toHaveBeenCalled();
        document.body.append(el);
        await settle();
        expect(spy).toHaveBeenCalled();
        // createdAt 0 against the real clock: days ago
        expect(el.querySelector(".ui-rvc__wait")!.textContent).toMatch(/\dd/);
      });

      test("controlled filter: preventDefault reports the click without applying it", async () => {
        const el = await make([A, B], { look });
        const changes: string[] = [];
        el.addEventListener("tc-filter-change", (e) => {
          e.preventDefault();
          changes.push((e as CustomEvent<{ filter: string }>).detail.filter);
        });
        button(el, /^High risk/).click();
        await settle();
        expect(changes).toEqual(["high"]);
        expect(button(el, /^All/).getAttribute("aria-pressed")).toBe("true");
        el.filter = "high";
        await settle();
        expect(button(el, /^High risk/).getAttribute("aria-pressed")).toBe("true");
        expect(el.querySelector(".ui-rvc__empty b")!.textContent).toBe("Nothing matches this filter");
      });

      test("queue rows are named by their visible text plus risk and confidence; long titles carry a title", async () => {
        const el = await make([F, B], { look });
        const r = rows(el)[0];
        expect(r.hasAttribute("aria-label")).toBe(false);
        expect(r.textContent).toContain("Reply to Maya");
        expect(r.textContent).toContain("high risk, 55% confidence");
        expect(r.querySelector(".ui-rvc__row-title")!.getAttribute("title")).toBe("Reply to Maya");
      });

      test("the status region is there from the start", async () => {
        const el = await make([A, B], { look });
        const live = el.querySelector('[aria-live="polite"]')!;
        expect(live.textContent).toBe("");
        await approve(el);
        expect(live.textContent).toContain("Approved: Refund order 1");
        expect(live.textContent).toContain("1 of 2 reviewed");
      });

      test("SLA state is in words and marked, not only coloured", async () => {
        const el = await make([{ ...A, createdAt: 0 }, B], { look, now: 60 * 60_000, sla: 30 * 60_000 });
        const wait = el.querySelector('.ui-rvc__wait[data-sla="over"]')!;
        expect(wait.querySelector("svg")).toBeTruthy();
        expect(wait.textContent).toContain("past the limit");
        expect(el.querySelector('.ui-rvc__oldest-time[data-sla="over"]')!.textContent).toContain("past the limit");
      });

      test("a flagged span: described by a hint; its note opens on hover, stays on the note, Esc closes it; focus opens it", async () => {
        const el = await make([F], { look });
        const mark = el.querySelector<HTMLElement>(".ui-rvc__flag")!;
        expect(mark.hasAttribute("aria-label")).toBe(false);
        const hint = document.getElementById(mark.getAttribute("aria-describedby")!.split(" ")[0])!;
        expect(hint.textContent).toContain("unsure");
        mark.dispatchEvent(new MouseEvent("mouseenter"));
        await settle();
        const tip = () => el.querySelector('[role="tooltip"]');
        expect(tip()!.textContent).toContain("Amount not confirmed");
        mark.dispatchEvent(new MouseEvent("mouseleave"));
        tip()!.dispatchEvent(new MouseEvent("mouseenter"));
        await new Promise((r) => setTimeout(r, 300));
        await settle();
        expect(tip()).toBeTruthy();
        // Esc closes it, with the focus elsewhere on the page
        key(document.body, "Escape");
        await settle();
        expect(tip()).toBeNull();
        mark.focus();
        await settle();
        expect(mark.getAttribute("aria-describedby")).toContain(tip()!.id);
        // F cycles the notes; Esc closes one opened by the keyboard
        mark.blur();
        el.focus();
        key(el, "f");
        await settle();
        expect(tip()).toBeTruthy();
        key(el, "Escape");
        await settle();
        expect(tip()).toBeNull();
      });

      test("Reject → focus on the first reason; Cancel (visible word, Esc key) → back on Reject", async () => {
        const el = await make([A, B], { look });
        const reject = button(el, /^Reject/);
        reject.focus();
        reject.click();
        await settle();
        expect(document.activeElement?.textContent).toContain("Wrong info");
        const cancel = button(el, /^Cancel/);
        expect(cancel.textContent).toBe("CancelEsc");
        expect(cancel.getAttribute("aria-keyshortcuts")).toBe("Escape");
        cancel.focus();
        cancel.click();
        await settle();
        await settle();
        expect(document.activeElement).toBe(button(el, /^Reject/));
      });

      test("Edit → Esc in the editor → focus back on Edit, not <body>; Save approves with the edits", async () => {
        const onDecide = vi.fn();
        const el = await make([{ ...F, id: "e" }, B], { look, onDecide });
        const edit = button(el, /^Edit/);
        edit.focus();
        edit.click();
        await settle();
        await new Promise((r) => requestAnimationFrame(r));
        const field = el.querySelector<HTMLTextAreaElement>("textarea")!;
        expect(document.activeElement).toBe(field);
        key(field, "Escape");
        await settle();
        await settle();
        expect(document.activeElement).toBe(button(el, /^Edit/));
        el.edit();
        await settle();
        el.setDraft("Hi Maya, all done.");
        await settle();
        expect(el.querySelector(".ui-rvc__mirror ins")).toBeTruthy();
        key(el.querySelector("textarea")!, "Enter", { metaKey: true });
        await settle();
        expect(onDecide).toHaveBeenCalledWith(expect.objectContaining({ id: "e" }), { decision: "approved", text: "Hi Maya, all done." });
      });

      test("the Undo chip waits while hovered or focused, goes after its time otherwise, and can be kept", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const el = await make([A, B], { look });
        await approve(el);
        const chip = () => el.querySelector<HTMLElement>(".ui-rvc__undo");
        chip()!.dispatchEvent(new MouseEvent("mouseenter"));
        await settle();
        vi.advanceTimersByTime(20_000);
        await settle();
        expect(chip()).toBeTruthy();
        chip()!.dispatchEvent(new MouseEvent("mouseleave"));
        button(el, /^Undo/).focus();
        await settle();
        vi.advanceTimersByTime(20_000);
        await settle();
        expect(chip()).toBeTruthy();
        button(el, /^Undo/).blur();
        await settle();
        vi.advanceTimersByTime(5_000);
        await settle();
        expect(chip()!.hasAttribute("data-leaving")).toBe(false);
        vi.advanceTimersByTime(1_000);
        await settle();
        expect(chip()).toBeNull();
        cleanup();
        const kept = await make([A, B], { look, undoTimeout: false });
        await approve(kept);
        vi.advanceTimersByTime(60_000);
        await settle();
        expect(kept.querySelector(".ui-rvc__undo")).toBeTruthy();
      });

      test("shortcuts false: single keys do nothing, Esc still backs out", async () => {
        const onDecide = vi.fn();
        const el = await make([A, B], { look, shortcuts: false, onDecide });
        key(el, "a");
        expect(onDecide).not.toHaveBeenCalled();
        button(el, /^Reject/).click();
        await settle();
        key(el, "1");
        expect(onDecide).not.toHaveBeenCalled();
        key(el, "Escape");
        await settle();
        expect(el.querySelector('[aria-label="Why reject it?"]')).toBeNull();
      });

      test("keys: A approves, R then 1 rejects with a reason, J/K move, S skips, Z undoes", async () => {
        const onDecide = vi.fn();
        const C = item("c", "Refund order 3");
        const el = await make([A, B, C], { look, onDecide });
        const undos: string[] = [];
        const skips: string[] = [];
        el.addEventListener("tc-undo", (e) => undos.push((e as CustomEvent<{ item: ReviewItem }>).detail.item.id));
        el.addEventListener("tc-skip", (e) => skips.push((e as CustomEvent<{ item: ReviewItem }>).detail.item.id));
        el.focus();
        key(el, "j");
        await settle();
        expect(row(el, "Refund order 2")!.getAttribute("aria-current")).toBe("true");
        key(el, "k");
        await settle();
        expect(row(el, "Refund order 1")!.getAttribute("aria-current")).toBe("true");
        key(el, "a");
        await settle();
        expect(onDecide).toHaveBeenLastCalledWith(expect.objectContaining({ id: "a" }), { decision: "approved" });
        key(el, "r");
        await settle();
        key(el, "1");
        await settle();
        expect(onDecide).toHaveBeenLastCalledWith(expect.objectContaining({ id: "b" }), { decision: "rejected", reason: "Wrong info" });
        key(el, "z");
        await settle();
        expect(undos).toEqual(["b"]);
        expect(row(el, "Refund order 2")!.getAttribute("aria-current")).toBe("true");
        key(el, "s");
        await settle();
        expect(skips).toEqual(["b"]);
        expect(row(el, "Refund order 2")!.textContent).toContain("skipped");
        expect(el.querySelector(".ui-rvc__count")!.textContent).toBe("1 of 3 reviewed");
      });
    });
  }

  test("styles: composited, finite sheen that pauses off-screen; no dark-only colour rules; field focus on the editor frame", () => {
    const text = css();
    expect(text).not.toMatch(/background-position/);
    expect(text).toMatch(/@keyframes ui-rvc-sweep \{ to \{ transform: translateX\(100%\); \} \}/);
    expect(text).toMatch(/ui-rvc-sweep [^;]* linear 3;/);
    expect(text).toMatch(/\[data-ui="rvc"\]\[data-offscreen\] \*[^{]*\{ animation-play-state: paused; \}/);
    expect(text).not.toMatch(/:where\(\.dark, \[data-theme="dark"\]\) :where\(\[data-look/);
    expect(text).toMatch(/\.ui-rvc__editor:focus-within \{ box-shadow: var\(--tc-field-shadow-focus/);
    expect(text).toMatch(/\.ui-rvc__btn\[data-primary\] \{ background: var\(--tc-action-primary-bg/);
  });

  test("a custom agent mark, step and source icons are cloned", async () => {
    const mk = (tag: string) => {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute(tag, "");
      return s;
    };
    const icon = mk("data-agent");
    const P: ReviewItem = { ...item("p", "Plan"), icon, steps: [{ title: "Export", tool: "HubSpot", icon: mk("data-step") }], sources: [{ label: "Doc", icon: mk("data-source"), href: "https://example.com" }] };
    const el = await make([P]);
    expect(el.querySelector(".ui-rvc__row .ui-rvc__avatar svg[data-agent]")).toBeTruthy();
    expect(el.querySelector(".ui-rvc__step-tool svg[data-step]")).toBeTruthy();
    expect(el.querySelector("a.ui-rvc__source svg[data-source]")).toBeTruthy();
    expect(icon.isConnected).toBe(false);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-review-center .items=${[F, A]} .now=${0}></tc-review-center>
      <tc-review-center look="clean" heading="Clean" .items=${[F, B]} .now=${0}></tc-review-center>
    </div>`);
    wrap.getAnimations({ subtree: true }).forEach((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.finish());
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
