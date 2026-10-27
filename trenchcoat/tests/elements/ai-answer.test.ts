/*
 * <tc-ai-answer> in real browsers – the React component's contract and regression checks, ported.
 */
import { html, render as litRender } from "lit";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/ai-answer";
import type { AnswerFeedback, AnswerSource, TcAiAnswer } from "../../src/elements/ai-answer";
import { cleanup } from "./helpers";

const FRAME = 16;
const clipboard = Object.getOwnPropertyDescriptor(Navigator.prototype, "clipboard");

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] }));
afterEach(() => {
  vi.useRealTimers();
  cleanup();
  delete (navigator as { clipboard?: unknown }).clipboard;
  if (clipboard) Object.defineProperty(Navigator.prototype, "clipboard", clipboard);
});

const ANSWER = "Checkout fails for EU cards because the payment intent skips the 3DS step when the currency is not USD, so the bank declines it. Moving the check into the confirm call fixes it for every region.";
const words = (s: string) => s.replace(/\s+/g, " ").trim();
const SOURCES: AnswerSource[] = [
  { title: "Remote work policy", name: "Notion", href: "https://example.com/a", snippet: "Up to 30 days." },
  { title: "Re: Lisbon", name: "Slack", href: "https://example.com/b" },
];

type Props = Partial<Pick<TcAiAnswer, "answer" | "sources" | "streaming" | "animated" | "feedback" | "onRegenerate" | "look" | "followUps" | "hideActions">>;

/** Mounts without waiting on animation frames (they're faked here) */
async function mount(props: Props) {
  const host = document.createElement("div");
  document.body.append(host);
  litRender(html`<tc-ai-answer></tc-ai-answer>`, host);
  const el = host.firstElementChild as TcAiAnswer;
  Object.assign(el, { sources: [], ...props });
  await el.updateComplete;
  const text = () => words(Array.from(el.querySelectorAll(".ui-ans__answer [data-i][data-on]"), (w) => w.textContent).join(""));
  return { el, text };
}
const frames = async (el: TcAiAnswer, ms: number) => {
  for (let t = 0; t < ms; t += FRAME) {
    vi.advanceTimersByTime(FRAME);
    await el.updateComplete;
  }
};
const byName = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === name);

for (const look of ["standard", "clean"] as const) {
  describe(`tc-ai-answer ${look}`, () => {
    test("the host is the root, with the look and the phase", async () => {
      const { el } = await mount({ look, answer: "Hi" });
      expect(el.dataset.ui).toBe("ans");
      expect(el.dataset.look).toBe(look);
      expect(el.dataset.phase).toBe("reading");
      await frames(el, 20);
      expect(el.dataset.phase).toBe("writing");
      await frames(el, 500);
      expect(el.dataset.phase).toBe("done");
    });

    test("typing renders only when a paragraph begins, not on every frame", async () => {
      const { el, text } = await mount({ look, answer: ANSWER });
      const renders = vi.spyOn(el as unknown as { render: () => unknown }, "render");
      await frames(el, 400);
      const partway = text();
      expect(partway.length).toBeGreaterThan(0);
      expect(partway.length).toBeLessThan(words(ANSWER).length);
      expect(words(ANSWER).startsWith(partway)).toBe(true);
      await frames(el, 800);
      expect(text()).toBe(words(ANSWER));
      expect(renders.mock.calls.length).toBeLessThanOrEqual(6);
    });

    test("an answer that starts out empty shows the text that comes later", async () => {
      const { el, text } = await mount({ look, answer: "" });
      await frames(el, 500);
      el.answer = "Hello brave new world";
      await frames(el, 1000);
      expect(text()).toBe("Hello brave new world");
      el.answer = "Hello brave new world, and more";
      el.streaming = true;
      await frames(el, 300);
      el.answer = "Hello brave new world, and more to come";
      el.streaming = false;
      await frames(el, 1000);
      expect(text()).toBe("Hello brave new world, and more to come");
    });

    const copy = async (writeText: (() => Promise<void>) | undefined) => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: writeText ? { writeText } : undefined });
      const { el } = await mount({ look, answer: "Short answer" });
      const onCopy = vi.fn();
      el.addEventListener("tc-copy", (e) => onCopy((e as CustomEvent).detail.text));
      await frames(el, 1000);
      byName(el, "Copy answer")!.click();
      await frames(el, 100);
      return { onCopy, copied: !!byName(el, "Copied") };
    };

    test("Copied only once the text is on the clipboard", async () => {
      const ok = await copy(() => Promise.resolve());
      expect(ok.copied).toBe(true);
      expect(ok.onCopy).toHaveBeenCalledWith(expect.stringContaining("Short answer"));
    });

    test("no Copied when the clipboard refuses", async () => {
      const refused = await copy(() => Promise.reject(new Error("NotAllowedError")));
      expect(refused.copied).toBe(false);
      expect(refused.onCopy).not.toHaveBeenCalled();
    });

    test("no Copied without a clipboard", async () => {
      const missing = await copy(undefined);
      expect(missing.copied).toBe(false);
      expect(missing.onCopy).not.toHaveBeenCalled();
    });

    test("controlled feedback: a restored verdict survives mount; preventDefault reports without applying", async () => {
      const { el } = await mount({ look, answer: "Short answer", feedback: { value: "up" } });
      const onChange = vi.fn();
      el.addEventListener("tc-feedback-change", (e) => {
        e.preventDefault();
        onChange((e as CustomEvent).detail.feedback);
      });
      await frames(el, 1000);
      expect(byName(el, "Good answer")!.getAttribute("aria-pressed")).toBe("true");
      expect(onChange).not.toHaveBeenCalled();
      byName(el, "Bad answer")!.click();
      await el.updateComplete;
      expect(onChange).toHaveBeenCalledWith({ value: "down" });
      expect(byName(el, "Good answer")!.getAttribute("aria-pressed")).toBe("true");
      // The contract: a thumbs down without a reason opens the reasons row
      for (const [value, open] of [[null, "false"], [{ value: "down" }, "true"]] as const) {
        el.feedback = value as AnswerFeedback | null;
        await el.updateComplete;
        expect(el.querySelector(".ui-ans__reasons")!.getAttribute("data-open")).toBe(open);
      }
    });

    test("uncontrolled feedback reports the reason, and a regenerated answer clears it", async () => {
      const { el } = await mount({ look, answer: "Short answer", onRegenerate: () => {} });
      const changes: (AnswerFeedback | null)[] = [];
      const verdicts: unknown[] = [];
      el.addEventListener("tc-feedback-change", (e) => changes.push((e as CustomEvent).detail.feedback));
      el.addEventListener("tc-feedback", (e) => verdicts.push((e as CustomEvent).detail));
      await frames(el, 1000);
      byName(el, "Bad answer")!.click();
      await el.updateComplete;
      byName(el, "Too long")!.click();
      await el.updateComplete;
      expect(changes.at(-1)).toEqual({ value: "down", reason: "Too long" });
      expect(verdicts).toEqual([{ value: "down", reason: "Too long" }]);
      byName(el, "Regenerate")!.click();
      await frames(el, 100);
      expect(changes.at(-1)).toBeNull();
    });

    test("a rejected onRegenerate is shown, and Regenerate can be tried again", async () => {
      const onRegenerate = vi.fn((): Promise<unknown> => Promise.reject(new Error("Model overloaded")));
      const { el } = await mount({ look, answer: "Short answer", onRegenerate });
      await frames(el, 1000);
      byName(el, "Regenerate")!.click();
      await frames(el, 1000);
      expect(el.querySelector('[role="alert"]')!.textContent).toBe("Couldn't regenerate: Model overloaded");
      onRegenerate.mockImplementation(() => Promise.resolve());
      byName(el, "Regenerate")!.click();
      await frames(el, 1000);
      expect(el.querySelector('[role="alert"]')!.textContent).toBe("");
      expect(onRegenerate).toHaveBeenCalledTimes(2);
    });

    test("the status region is there from mount and announces the result once done (4.1.3)", async () => {
      const { el } = await mount({ look, answer: "Short answer" });
      const region = el.querySelector('[role="status"]')!;
      expect(region.textContent).toBe("");
      await frames(el, 1000);
      expect(el.querySelector('[role="status"]')).toBe(region);
      expect(region.textContent).toMatch(/^Answered in /);
    });

    test("a citation chip is named by what it shows, then the titles (2.5.3)", async () => {
      const { el } = await mount({ look, sources: SOURCES, answer: "Yes, you can [1][2].", animated: false });
      await frames(el, 100);
      const chip = el.querySelector<HTMLButtonElement>(".ui-ans__cite")!;
      expect(chip.hasAttribute("aria-label")).toBe(false);
      expect(chip.textContent!.startsWith("Notion+1")).toBe(true);
      expect(chip.textContent).toContain("Remote work policy; Re: Lisbon");
    });

    test("hovering a chip previews its sources and lights their cards; Esc closes it without moving focus (1.4.13)", async () => {
      const { el } = await mount({ look, sources: SOURCES, answer: "Yes [1].", animated: false });
      await frames(el, 100);
      const chip = el.querySelector<HTMLButtonElement>(".ui-ans__cite")!;
      chip.dispatchEvent(new MouseEvent("mouseenter"));
      await el.updateComplete;
      const tip = el.querySelector('[role="tooltip"]')!;
      expect(tip.textContent).toContain("Up to 30 days.");
      expect(chip.getAttribute("aria-describedby")).toBe(tip.id);
      expect(el.querySelector(".ui-ans__source[data-lit]")!.textContent).toContain("Notion");
      byName(el, "Copy answer")!.focus();
      document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await el.updateComplete;
      expect(el.querySelector('[role="tooltip"]')).toBeNull();
      expect(document.activeElement).toBe(byName(el, "Copy answer"));
    });

    test("Stop gives way to the actions with focus on Copy, not <body> (2.4.3)", async () => {
      const { el } = await mount({ look, answer: ANSWER });
      const onStop = vi.fn();
      el.addEventListener("tc-stop", onStop);
      await frames(el, 100);
      const stop = byName(el, "Stop")!;
      stop.focus();
      stop.click();
      await el.updateComplete;
      await Promise.resolve();
      expect(onStop).toHaveBeenCalledOnce();
      expect(document.activeElement).toBe(byName(el, "Copy answer"));
    });

    test("the folded reasons are inert; picking one sends focus back to Bad answer (2.4.3, S6)", async () => {
      const { el } = await mount({ look, answer: "Short answer" });
      await frames(el, 1000);
      const fold = el.querySelector<HTMLElement>(".ui-ans__reasons")!;
      expect(fold.inert).toBe(true);
      byName(el, "Bad answer")!.click();
      await el.updateComplete;
      expect(fold.inert).toBe(false);
      const reason = byName(el, "Too long")!;
      reason.focus();
      reason.click();
      await el.updateComplete;
      expect(fold.inert).toBe(true);
      expect(document.activeElement).toBe(byName(el, "Bad answer"));
    });

    test("caught up while streaming, the writing loop stops instead of spinning every frame (perf)", async () => {
      const { el } = await mount({ look, answer: "Hello there", streaming: true });
      await frames(el, 1000);
      const raf = vi.spyOn(window, "requestAnimationFrame");
      await frames(el, 500);
      expect(raf.mock.calls.length).toBeLessThan(3);
      raf.mockRestore();
      el.answer = "Hello there, and more";
      el.streaming = false;
      await frames(el, 1000);
      expect(el.querySelector('[role="status"]')!.textContent).toMatch(/^Answered in /);
    });

    test("hide-actions: Stop while writing, then no built-in actions, reasons or status row – the result is still announced", async () => {
      const { el } = await mount({ look, answer: ANSWER, hideActions: true });
      await frames(el, 100);
      const stop = byName(el, "Stop")!;
      expect(stop).toBeTruthy();
      stop.focus();
      stop.click();
      await el.updateComplete;
      await Promise.resolve();
      expect(el.querySelector(".ui-ans__foot")).toBeNull();
      expect(el.querySelector(".ui-ans__reasons")).toBeNull();
      expect(byName(el, "Copy answer")).toBeUndefined();
      expect(byName(el, "Regenerate")).toBeUndefined();
      // Focus doesn't drop to <body> when Stop goes
      expect(document.activeElement).not.toBe(document.body);
      expect(el.querySelector('[role="status"]')!.textContent).toBe("Stopped");
      el.hideActions = false;
      await el.updateComplete;
      expect(byName(el, "Copy answer")).toBeTruthy();
    });

    test("follow-ups show once done and fire tc-follow-up", async () => {
      const { el } = await mount({ look, answer: "Short", followUps: ["What next?"] });
      const onFollow = vi.fn();
      el.addEventListener("tc-follow-up", (e) => onFollow((e as CustomEvent).detail.question));
      expect(el.querySelector(".ui-ans__follow")).toBeNull();
      await frames(el, 1000);
      byName(el, "What next?")!.click();
      expect(onFollow).toHaveBeenCalledWith("What next?");
    });

    test("an icon element is cloned", async () => {
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("data-mine", "");
      const { el } = await mount({ look, sources: [{ ...SOURCES[0], icon }], answer: "Hi" });
      expect(el.querySelector(".ui-ans__favicon svg[data-mine]")).toBeTruthy();
      expect(icon.isConnected).toBe(false);
    });

    test("no frames or timers left behind when removed", async () => {
      const { el } = await mount({ look, sources: SOURCES, answer: ANSWER });
      el.remove();
      expect(vi.getTimerCount()).toBe(0);
    });
  });
}

test("the shine moves by transform, the mascot rests, the +N count isn't faded (perf, 2.2.2, 1.4.3)", () => {
  const css = (customElements.get("tc-ai-answer") as unknown as typeof TcAiAnswer).css;
  expect(css).not.toContain("background-position");
  expect(css).not.toMatch(/ui-ans-(look|blink)[^;]*infinite/);
  expect(css).not.toMatch(/\.ui-ans__more \{[^}]*opacity/);
});

test("axe: no violations in either look", async () => {
  vi.useRealTimers();
  const a = await mount({ sources: SOURCES, answer: "Yes, you can [1][2].\n\n- One\n- Two", animated: false, followUps: ["More?"] });
  const b = await mount({ look: "clean", sources: SOURCES, answer: "Yes [1].", animated: false });
  await new Promise((r) => setTimeout(r, 100));
  await a.el.updateComplete;
  await b.el.updateComplete;
  for (const x of document.getAnimations()) if (x.effect?.getComputedTiming().iterations !== Infinity) x.finish();
  const result = await axe.run(document.body, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
