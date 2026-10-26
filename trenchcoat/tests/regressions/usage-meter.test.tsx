/* usage-meter: the number tween set state on every frame, re-rendering the whole card (audit theme 1) */
import { Profiler, StrictMode, type ReactNode } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/usage-meter";
import * as clean from "@components/usage-meter-clean";
import type { UsageMeterProps } from "@components/usage-meter";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const FRAME = 16;

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] }));
afterEach(() => vi.useRealTimers());

const frames = async (ms: number, each?: () => void) => {
  for (let t = 0; t < ms; t += FRAME) {
    await act(async () => {
      vi.advanceTimersByTime(FRAME);
    });
    each?.();
  }
};

const PROPS: UsageMeterProps = {
  total: 10_000,
  used: [
    { label: "Chat", value: 4200 },
    { label: "API", value: 1800 },
  ],
  limits: [{ label: "Seats", used: 3, total: 5 }],
  daily: [
    { label: "Mon", value: 300 },
    { label: "Tue", value: 900 },
  ],
  unit: "credits",
};

for (const [style, ui] of styles) {
  describe(`usage-meter ${style}`, () => {
    const mount = (props: UsageMeterProps) => {
      const count = { commits: 0 };
      const wrap = (p: UsageMeterProps): ReactNode => (
        <StrictMode>
          <Profiler id="meter" onRender={() => count.commits++}>
            <ui.UsageMeter {...p} />
          </Profiler>
        </StrictMode>
      );
      const view = render(wrap(props));
      const q = (sel: string) => view.container.querySelector<HTMLElement>(`[class$="${sel}"]`)!;
      return { count, view, q, rerender: (p: UsageMeterProps) => view.rerender(wrap(p)) };
    };

    test("the count-in runs without re-rendering, and ends on the real numbers", async () => {
      const { count, q, view } = mount(PROPS);
      count.commits = 0;
      const seen = new Set<string>();
      await frames(1600, () => seen.add(q("__big").textContent!));
      // The number rolled through many values, drawn by the frames rather than by renders
      expect(seen.size).toBeGreaterThan(20);
      expect(count.commits).toBeLessThan(10);
      expect(q("__big").textContent).toBe("6,000");
      expect(q("__pct").textContent).toContain("60%");
      // Number and unit are joined by a no-break space
      expect(view.container.textContent).toMatch(/4,000\scredits left/);
      expect(q("__limit-value").textContent).toMatch(/^3 of 5/);
      const segs = [...view.container.querySelectorAll<HTMLElement>('[class$="__seg"]')].map((s) => s.style.width);
      expect(segs).toEqual(["42%", "18%"]);
      expect(q("__share").textContent).toBe("70%");
    });

    test("no React commits at rest, and a change tweens to the new numbers", async () => {
      const { count, q, rerender } = mount(PROPS);
      await frames(1600);
      count.commits = 0;
      await frames(1000);
      expect(count.commits).toBe(0);
      rerender({ ...PROPS, used: [{ label: "Chat", value: 5000 }, PROPS.used[1]] });
      await frames(1000);
      expect(count.commits).toBeLessThan(5);
      expect(q("__big").textContent).toBe("6,800");
    });
  });
}

/* Phase 3 – one API contract: controllable period, clock from `now` or after mount, locale, DOM props */
for (const [style, ui] of styles) {
  describe(`usage-meter ${style} – contract`, () => {
    const PERIODS = [
      { id: "now", label: "This month" },
      { id: "last", label: "Last month" },
    ];
    const checked = (c: HTMLElement) => c.querySelector('[role="radio"][aria-checked="true"]')?.textContent;

    test("uncontrolled period switches and reports; controlled period only reports", async () => {
      const seen: string[] = [];
      const view = render(<ui.UsageMeter {...PROPS} periods={PERIODS} onPeriodChange={(id) => seen.push(id)} />);
      expect(checked(view.container)).toBe("This month");
      await act(async () => view.container.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1].click());
      expect(checked(view.container)).toBe("Last month");
      expect(seen).toEqual(["last"]);
      view.unmount();

      const fixed = render(<ui.UsageMeter {...PROPS} periods={PERIODS} period="now" onPeriodChange={(id) => seen.push(id)} />);
      await act(async () => fixed.container.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1].click());
      expect(checked(fixed.container)).toBe("This month");
      expect(seen).toEqual(["last", "last"]);
    });

    test("the reset countdown uses `now` (epoch ms) and never the clock during render", () => {
      const now = Date.UTC(2026, 9, 1, 12);
      const view = render(<ui.UsageMeter {...PROPS} now={now} resetAt={now + 9 * 864e5} />);
      expect(view.container.querySelector("time")!.textContent).toMatch(/^Resets in 9\sdays$/);
    });

    test("without `now` the countdown fills in after mount", async () => {
      vi.setSystemTime(Date.UTC(2026, 9, 1, 12));
      const view = render(<ui.UsageMeter {...PROPS} resetAt={Date.UTC(2026, 9, 2, 12)} />);
      await act(async () => {});
      expect(view.container.querySelector("time")!.textContent).toBe("Resets tomorrow");
    });

    test("numbers follow the locale", async () => {
      const view = render(<ui.UsageMeter {...PROPS} locale="de-DE" />);
      await frames(1600);
      expect(view.container.querySelector('[class$="__big"]')!.textContent).toBe("6.000");
    });

    test("default colors stay with their label when another label leaves", async () => {
      const view = render(<ui.UsageMeter {...PROPS} />);
      const swatch = () => [...view.container.querySelectorAll<HTMLElement>('[class$="__legend"] [class$="__swatch"]')].map((s) => s.style.background);
      const [, api] = swatch();
      view.rerender(<ui.UsageMeter {...PROPS} used={[{ label: "API", value: 1800 }]} />);
      await frames(600);
      expect(swatch()).toEqual([api]);
    });
  });
}

/*
 * WCAG + design pass: the credits meter has a name (axe aria-meter-name); the limit dot is decoration with the state
 * in words (axe aria-prohibited-attr); the sparkline is a slider whose value text is the day (it promised "arrow keys
 * read each day"); the bar's tooltip is visual (no hover caption in a live region) – the arrow keys announce through
 * the one persistent status region; a hover tooltip closes with Escape (1.4.13); the button follows Button's recipe.
 */
const plain = (s: string | null) => (s ?? "").replace(/\u00a0/g, " ");
const WARN: UsageMeterProps = { ...PROPS, limits: [{ label: "Seats", used: 9, total: 10 }] };

for (const [style, ui] of styles) {
  describe(`usage-meter a11y ${style}`, () => {
    test("the credits meter is named and the limit state is in words, not an aria-label on a span", () => {
      const { container, getByRole } = render(<ui.UsageMeter {...WARN} />);
      expect(getByRole("meter", { name: "Credits used" })).toBeTruthy();
      const dot = container.querySelector(".ui-um__limit .ui-um__dot")!;
      expect(dot.getAttribute("aria-label")).toBeNull();
      expect(dot.getAttribute("aria-hidden")).toBe("true");
      expect(container.querySelector(".ui-um__limit-label")!.textContent).toContain("close to the limit");
    });

    test("the status region is there from the start, and the tooltip is not a live region", () => {
      const { container, getByRole } = render(<ui.UsageMeter {...PROPS} />);
      expect(getByRole("status").textContent).toBe("");
      const tip = container.querySelector(".ui-um__tip")!;
      expect(tip.getAttribute("aria-live")).toBeNull();
      expect(tip.getAttribute("aria-hidden")).toBe("true");
    });

    test("arrow keys on the bar announce each category through the status region; Escape clears", async () => {
      const { getByRole } = render(<ui.UsageMeter {...PROPS} />);
      await frames(1500);
      const bar = getByRole("group", { name: /credits used/ });
      await act(async () => {
        bar.focus();
        bar.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      });
      expect(plain(getByRole("status").textContent)).toBe("Chat: 4,200 credits, 70%");
      await act(async () => bar.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true })));
      expect(plain(getByRole("status").textContent)).toBe("API: 1,800 credits, 30%");
      expect(bar.hasAttribute("data-active")).toBe(true);
      await act(async () => bar.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
      expect(bar.hasAttribute("data-active")).toBe(false);
    });

    test("a tooltip opened by hover closes with Escape pressed anywhere, without moving focus", async () => {
      const { container, getByRole } = render(
        <>
          <button type="button">elsewhere</button>
          <ui.UsageMeter {...PROPS} />
        </>,
      );
      const other = getByRole("button", { name: "elsewhere" });
      other.focus();
      const item = container.querySelector(".ui-um__item")!;
      await act(async () => item.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" })));
      // pointerenter is synthesized by React from pointerover/out
      const bar = container.querySelector(".ui-um__bar")!;
      expect(bar.hasAttribute("data-active")).toBe(true);
      await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
      expect(bar.hasAttribute("data-active")).toBe(false);
      expect(document.activeElement).toBe(other);
    });

    test("the sparkline is a slider: arrows, Home and End move the day and its value text reads it", async () => {
      const { getByRole } = render(<ui.UsageMeter {...PROPS} />);
      const spark = getByRole("slider", { name: "Usage per day" });
      expect(plain(spark.getAttribute("aria-valuetext"))).toBe("Average 600 credits per day");
      await act(async () => spark.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true })));
      expect(plain(spark.getAttribute("aria-valuetext"))).toBe("Mon: 300 credits");
      expect(spark.getAttribute("aria-valuenow")).toBe("1");
      await act(async () => spark.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
      expect(plain(spark.getAttribute("aria-valuetext"))).toBe("Tue: 900 credits");
      expect(spark.getAttribute("aria-valuenow")).toBe("2");
    });

    test("the period switch keeps its radiogroup keyboard pattern", async () => {
      const periods = [
        { id: "m", label: "Month" },
        { id: "w", label: "Week" },
      ];
      const { getByRole } = render(<ui.UsageMeter {...PROPS} periods={periods} />);
      const month = getByRole("radio", { name: "Month" });
      month.focus();
      await act(async () => month.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
      const week = getByRole("radio", { name: "Week" });
      expect(week.getAttribute("aria-checked")).toBe("true");
      expect(document.activeElement).toBe(week);
      expect(month.getAttribute("tabindex")).toBe("-1");
    });
  });
}

/* layout: "stacked" (default, unchanged) or "wide" – the two-column layout screens used to force through .ui-um__… */
for (const [style, ui] of styles) {
  describe(`usage-meter (${style}) – layout`, () => {
    const css = () => document.querySelector('style[data-href="ui-usage-meter"], style[href="ui-usage-meter"]')?.textContent ?? "";

    test("stacked by default: no layout attribute, the markup is unchanged", () => {
      const { container } = render(<ui.UsageMeter {...PROPS} />);
      const stacked = render(<ui.UsageMeter {...PROPS} layout="stacked" />).container;
      expect(container.querySelector(".ui-um")!.hasAttribute("data-layout")).toBe(false);
      expect(stacked.querySelector(".ui-um")!.hasAttribute("data-layout")).toBe(false);
    });

    test('"wide" marks the root, and the styles go full width with two columns once the card is wide', () => {
      const { container } = render(<ui.UsageMeter {...PROPS} layout="wide" className="mine" />);
      const root = container.querySelector(".ui-um")!;
      expect(root.getAttribute("data-layout")).toBe("wide");
      expect(root.getAttribute("data-look")).toBe(style);
      expect(root.classList.contains("mine")).toBe(true);
      const sheet = css().replace(/\s+/g, " ");
      expect(sheet).toMatch(/\.ui-um\[data-layout="wide"\] \{ max-width: none; \}/);
      expect(sheet).toMatch(/@container \(min-width: 640px\) \{ \.ui-um\[data-layout="wide"\] \.ui-um__inner \{ display: grid; grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/);
      // The pieces keep their pattern tokens: the limits still open with the divider, in both looks
      expect(sheet).toMatch(/\.ui-um\[data-layout="wide"\] \.ui-um__limits \{ grid-column: 2;/);
      expect(sheet).toMatch(/\.ui-um__limits \{[^}]*border-top: var\(--tc-hairline/);
    });
  });
}
