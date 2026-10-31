/*
 * <tc-usage-meter> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/usage-meter";
import type { TcUsageMeter, UsageItem, UsageLimit, UsageDay } from "../../src/elements/usage-meter";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const USED: UsageItem[] = [
  { label: "Chat", value: 4200 },
  { label: "API", value: 1800 },
];
const LIMITS: UsageLimit[] = [{ label: "Seats", used: 3, total: 5 }];
const DAILY: UsageDay[] = [
  { label: "Mon", value: 300 },
  { label: "Tue", value: 900 },
];
const PERIODS = [
  { id: "now", label: "This month" },
  { id: "last", label: "Last month" },
];
const looks = ["standard", "clean"] as const;
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ");
/** The count-in takes 1.2 s: waits until every meter at or under `root` has finished rolling and shows its real number */
const counted = async (root: Element, big = "6,000") => {
  const meters = [...(root.matches("tc-usage-meter") ? [root] : []), ...root.querySelectorAll("tc-usage-meter")] as TcUsageMeter[];
  await expect.poll(() => meters.every((m) => m["frame"] === 0 && m.querySelector(".ui-um__big")?.textContent === big), { timeout: 5000 }).toBe(true);
  await settle();
};
const meter = (look: string = "standard") =>
  fixture<TcUsageMeter>(html`<tc-usage-meter look=${look} total="10000" unit="credits" .used=${USED} .limits=${LIMITS} .daily=${DAILY}></tc-usage-meter>`);
const key = async (target: Element, k: string) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await settle();
};
const checked = (el: Element) => el.querySelector('[role="radio"][aria-checked="true"]')?.textContent;

describe("tc-usage-meter", () => {
  for (const look of looks) {
    test(`${look}: the host is the root and the region, named by its heading`, async () => {
      const el = await meter(look);
      expect(el.dataset.ui).toBe("um");
      expect(el.dataset.look).toBe(look);
      expect(el.dataset.state).toBe("ok");
      expect(el.getAttribute("role")).toBe("region");
      const title = document.getElementById(el.getAttribute("aria-labelledby")!)!;
      expect(title.textContent).toBe("Usage");
      el.heading = "Credits";
      await settle();
      expect(title.textContent).toBe("Credits");
    });

    test(`${look}: the count-in ends on the real numbers`, async () => {
      // Each frame counts as 16 ms, so a slow runner that drops frames still rolls through the same values
      const realFrame = window.requestAnimationFrame;
      let clock = 0;
      window.requestAnimationFrame = (run) => realFrame(() => run((clock += 16)));
      const seen = new Set<string>();
      let el: TcUsageMeter;
      let big: Element;
      try {
        el = await meter(look);
        big = el.querySelector(".ui-um__big")!;
        // Read it every frame until it lands
        for (let i = 0; i < 600 && big.textContent !== "6,000"; i++) {
          seen.add(big.textContent!);
          await new Promise((r) => requestAnimationFrame(r));
        }
      } finally {
        window.requestAnimationFrame = realFrame;
      }
      await counted(el);
      // The number rolled through many values
      expect(seen.size).toBeGreaterThan(5);
      expect(big.textContent).toBe("6,000");
      expect(el.querySelector(".ui-um__pct")!.textContent).toContain("60%");
      // Number and unit are joined by a no-break space
      expect(el.textContent).toMatch(/4,000 credits left/);
      expect(el.querySelector(".ui-um__limit-value")!.textContent).toMatch(/^3 of 5/);
      const segs = [...el.querySelectorAll<HTMLElement>(".ui-um__seg")].map((s) => s.style.width);
      expect(segs).toEqual(["42%", "18%"]);
      expect(el.querySelector(".ui-um__share")!.textContent).toBe("70%");
    });
  }

  test("a change tweens to the new numbers", async () => {
    const el = await meter();
    await counted(el);
    el.used = [{ label: "Chat", value: 5000 }, USED[1]];
    await settle();
    await counted(el, "6,800");
  });

  test("warn and limit: the state, the dot, the words and the button", async () => {
    const el = await meter();
    await counted(el);
    expect(el.querySelector(".ui-um__action-text")!.textContent).toBe("Upgrade");
    el.used = [{ label: "Chat", value: 8500 }];
    await settle();
    expect(el.dataset.state).toBe("warn");
    expect(el.querySelector(".ui-um__status b")!.textContent).toBe("Running low");
    expect(el.querySelector(".ui-um__action-text")!.textContent).toBe("Add credits");
    expect(el.querySelector(".ui-um__action")!.hasAttribute("data-strong")).toBe(true);
    expect(plain(el.querySelector('[role="status"]')!.textContent)).toBe("Usage: running low, 85% of credits used");
    el.used = [{ label: "Chat", value: 10500 }];
    await settle();
    expect(el.dataset.state).toBe("limit");
    expect(el.querySelector(".ui-um__status b")!.textContent).toBe("Limit reached");
    expect(plain(el.querySelector(".ui-um__status .ui-um__muted")!.textContent)).toBe("500 over");
  });

  test("the button fires tc-upgrade with the state", async () => {
    const el = await meter();
    const seen: string[] = [];
    el.addEventListener("tc-upgrade", (e) => seen.push((e as CustomEvent).detail.state));
    el.querySelector<HTMLButtonElement>(".ui-um__action")!.click();
    expect(seen).toEqual(["ok"]);
  });

  test("uncontrolled period switches and reports; controlled period only reports", async () => {
    const el = await fixture<TcUsageMeter>(html`<tc-usage-meter total="10000" .used=${USED} .periods=${PERIODS}></tc-usage-meter>`);
    const seen: string[] = [];
    el.addEventListener("tc-period-change", (e) => seen.push((e as CustomEvent).detail.period));
    expect(checked(el)).toBe("This month");
    el.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1].click();
    await settle();
    expect(checked(el)).toBe("Last month");
    expect(seen).toEqual(["last"]);

    const fixed = await fixture<TcUsageMeter>(html`<tc-usage-meter total="10000" .used=${USED} .periods=${PERIODS} period="now"></tc-usage-meter>`);
    fixed.addEventListener("tc-period-change", (e) => {
      e.preventDefault();
      seen.push((e as CustomEvent).detail.period);
    });
    fixed.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1].click();
    await settle();
    expect(checked(fixed)).toBe("This month");
    expect(seen).toEqual(["last", "last"]);
    fixed.period = "last";
    await settle();
    expect(checked(fixed)).toBe("Last month");
  });

  test("the period switch keeps its radiogroup keyboard pattern, and the pill sits under the chosen period", async () => {
    const el = await fixture<TcUsageMeter>(html`<tc-usage-meter total="10000" .used=${USED} .periods=${[{ id: "m", label: "Month" }, { id: "w", label: "Week" }]}></tc-usage-meter>`);
    const [month, week] = el.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    month.focus();
    await key(month, "ArrowRight");
    expect(week.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(week);
    expect(month.getAttribute("tabindex")).toBe("-1");
    const pill = el.querySelector<HTMLElement>(".ui-um__pill")!;
    await expect.poll(() => pill.style.width, { timeout: 3000 }).toBe(`${week.offsetWidth}px`);
    expect(pill.style.transform).toBe(`translate(${week.offsetLeft}px, ${week.offsetTop}px)`);
  });

  test("the reset countdown uses `now` (epoch ms)", async () => {
    const now = Date.UTC(2026, 9, 1, 12);
    const el = await fixture<TcUsageMeter>(html`<tc-usage-meter total="10000" .used=${USED} .now=${now} .resetAt=${now + 9 * 864e5} plan="Pro plan"></tc-usage-meter>`);
    expect(plain(el.querySelector("time")!.textContent)).toBe("Resets in 9 days");
    expect(el.querySelector(".ui-um__sub")!.textContent).toMatch(/^Pro plan·Resets/);
  });

  test("without `now` the countdown reads the clock after connecting", async () => {
    const el = await fixture<TcUsageMeter>(html`<tc-usage-meter total="10000" .used=${USED} .resetAt=${Date.now() + 864e5 - 60_000}></tc-usage-meter>`);
    await settle();
    expect(el.querySelector("time")!.textContent).toBe("Resets tomorrow");
  });

  test("numbers follow the locale", async () => {
    const el = await fixture<TcUsageMeter>(html`<tc-usage-meter total="10000" locale="de-DE" .used=${USED}></tc-usage-meter>`);
    await counted(el, "6.000");
  });

  test("default colors stay with their label when another label leaves; the leaving row folds away", async () => {
    const el = await meter();
    const swatch = () => [...el.querySelectorAll<HTMLElement>(".ui-um__legend .ui-um__swatch")].map((s) => s.style.background);
    const [, api] = swatch();
    el.used = [{ label: "API", value: 1800 }];
    await settle();
    expect(el.querySelector(".ui-um__row[data-leaving]")!.textContent).toContain("Chat");
    await expect.poll(() => el.querySelector(".ui-um__row[data-leaving]"), { timeout: 3000 }).toBeNull();
    await settle();
    expect(swatch()).toEqual([api]);
  });

  test("the credits meter is named and the limit state is in words, not an aria-label on a span", async () => {
    const el = await fixture<TcUsageMeter>(html`<tc-usage-meter total="10000" .used=${USED} .limits=${[{ label: "Seats", used: 9, total: 10 }]}></tc-usage-meter>`);
    expect(el.querySelector('[role="meter"].ui-um__track')!.getAttribute("aria-label")).toBe("Credits used");
    const dot = el.querySelector(".ui-um__limit .ui-um__dot")!;
    expect(dot.getAttribute("aria-label")).toBeNull();
    expect(dot.getAttribute("aria-hidden")).toBe("true");
    expect(el.querySelector(".ui-um__limit-label")!.textContent).toContain("close to the limit");
  });

  test("the status region is there from the start, and the tooltip is not a live region", async () => {
    const el = await meter();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("");
    const tip = el.querySelector(".ui-um__tip")!;
    expect(tip.getAttribute("aria-live")).toBeNull();
    expect(tip.getAttribute("aria-hidden")).toBe("true");
  });

  test("arrow keys on the bar announce each category through the status region; Escape clears", async () => {
    const el = await meter();
    await counted(el);
    const bar = el.querySelector<HTMLElement>('[role="group"].ui-um__bar')!;
    bar.focus();
    await key(bar, "ArrowRight");
    expect(plain(el.querySelector('[role="status"]')!.textContent)).toBe("Chat: 4,200 credits, 70%");
    expect(el.querySelector(".ui-um__tip[data-open]")!.textContent).toContain("Chat");
    await key(bar, "End");
    expect(plain(el.querySelector('[role="status"]')!.textContent)).toBe("API: 1,800 credits, 30%");
    expect(bar.hasAttribute("data-active")).toBe(true);
    await key(bar, "Escape");
    expect(bar.hasAttribute("data-active")).toBe(false);
  });

  test("a tooltip opened by hover closes with Escape pressed anywhere, without moving focus", async () => {
    const wrap = await fixture(html`<div><button type="button">elsewhere</button><tc-usage-meter total="10000" .used=${USED}></tc-usage-meter></div>`);
    const other = wrap.querySelector("button")!;
    other.focus();
    const el = wrap.querySelector("tc-usage-meter")!;
    el.querySelector(".ui-um__item")!.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    await settle();
    const bar = el.querySelector(".ui-um__bar")!;
    expect(bar.hasAttribute("data-active")).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    expect(bar.hasAttribute("data-active")).toBe(false);
    expect(document.activeElement).toBe(other);
  });

  test("the sparkline is a slider: arrows, Home and End move the day and its value text reads it", async () => {
    const el = await meter();
    const spark = () => el.querySelector<HTMLElement>('[role="slider"]')!;
    expect(spark().getAttribute("aria-label")).toBe("Usage per day");
    expect(plain(spark().getAttribute("aria-valuetext"))).toBe("Average 600 credits per day");
    await key(spark(), "Home");
    expect(plain(spark().getAttribute("aria-valuetext"))).toBe("Mon: 300 credits");
    expect(spark().getAttribute("aria-valuenow")).toBe("1");
    await key(spark(), "ArrowRight");
    expect(plain(spark().getAttribute("aria-valuetext"))).toBe("Tue: 900 credits");
    expect(spark().getAttribute("aria-valuenow")).toBe("2");
    expect(plain(el.querySelector(".ui-um__daily-read")!.textContent)).toBe("Tue · 900 credits");
    await key(spark(), "Escape");
    expect(plain(el.querySelector(".ui-um__daily-read")!.textContent)).toBe("Avg 600 / day");
  });

  test("stacked by default; wide drops the max-width and splits into two columns from 640px", async () => {
    for (const look of looks) {
      const wrap = await fixture(html`<div style="width: 900px">
        <tc-usage-meter look=${look} total="10000" .used=${USED} .limits=${LIMITS} .daily=${DAILY}></tc-usage-meter>
        <tc-usage-meter look=${look} layout="wide" total="10000" .used=${USED} .limits=${LIMITS} .daily=${DAILY}></tc-usage-meter>
      </div>`);
      const [stacked, wide] = wrap.querySelectorAll("tc-usage-meter");
      expect(stacked.hasAttribute("data-layout")).toBe(false);
      expect(getComputedStyle(stacked).maxWidth).toBe("460px");
      expect(wide.getAttribute("data-layout")).toBe("wide");
      expect(getComputedStyle(wide).maxWidth).toBe("none");
      const inner = wide.querySelector(".ui-um__inner")!;
      expect(getComputedStyle(inner).display).toBe("grid");
      expect(getComputedStyle(wide.querySelector(".ui-um__limits")!).gridColumnStart).toBe("2");
      cleanup();
    }
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-usage-meter total="10000" plan="Pro plan" .now=${0} .resetAt=${9 * 864e5} .used=${USED} .limits=${[...LIMITS, { label: "Projects", used: 4, total: null }]} .daily=${DAILY} .periods=${PERIODS}></tc-usage-meter>
      <tc-usage-meter look="clean" heading="Clean" total="10000" .used=${USED} .limits=${LIMITS} .daily=${DAILY} .periods=${PERIODS}></tc-usage-meter>
    </div>`);
    await counted(wrap);
    await finish();
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
