/*
 * <tc-budget-guard> in real browsers: the host and both looks, ok → warn → stop, the pace, raising a cap (and
 * controlled use), the stop event, focus after a raise, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/budget-guard";
import type { BudgetLimit, TcBudgetGuard } from "../../src/elements/budget-guard";
import { BudgetGuard } from "../../src/elements/react/budget-guard";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const looks = ["standard", "clean"] as const;
const spend = (used: number, extra: Partial<BudgetLimit> = {}): BudgetLimit => ({ id: "spend", label: "Spend", kind: "currency", used, cap: 5, rate: 0.5, ...extra });
const TOKENS: BudgetLimit = { id: "tokens", label: "Tokens", kind: "tokens", used: 182_400, cap: 250_000 };
const CALLS: BudgetLimit = { id: "calls", label: "Tool calls", unit: "calls", used: 12, cap: 40 };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const guard = (limits: BudgetLimit[], look = "standard", status = "running") =>
  fixture<TcBudgetGuard>(html`<tc-budget-guard look=${look} task="Research agent" status=${status} .limits=${limits}></tc-budget-guard>`);

describe("tc-budget-guard", () => {
  for (const look of looks) {
    test(`${look}: the host is the root and a region named by its heading; the first limit is the big meter`, async () => {
      const el = await guard([spend(2), TOKENS, CALLS], look);
      expect(el.dataset.ui).toBe("bgd");
      expect(el.dataset.look).toBe(look);
      expect(el.dataset.state).toBe("ok");
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Run budget");
      expect(el.querySelector(".ui-bgd__big")!.textContent).toBe("$2.00");
      expect(plain(el.querySelector(".ui-bgd__of")!.textContent)).toBe("of $5.00 spend cap");
      expect(el.querySelector(".ui-bgd__pct")!.textContent).toBe("40%");
      expect([...el.querySelectorAll(".ui-bgd__limit-value")].map((v) => plain(v.textContent))).toEqual(["182k of 250k tokens", "12 calls of 40 calls"]);
      expect(el.querySelector(".ui-bgd__pill")!.textContent).toBe("Live");
      expect(plain(el.querySelector(".ui-bgd__status")!.textContent)).toBe("$3.00 left");
      // The note is folded away while there's room
      expect(el.querySelector(".ui-bgd__fold")!.hasAttribute("data-open")).toBe(false);
    });
  }

  test("meters: role, values, the warning notch; the pace while running", async () => {
    const el = await guard([spend(2), TOKENS]);
    const hero = el.querySelector<HTMLElement>('.ui-bgd__track[role="meter"]')!;
    expect(hero.getAttribute("aria-label")).toBe("Spend");
    expect(hero.getAttribute("aria-valuemax")).toBe("5");
    expect(hero.getAttribute("aria-valuenow")).toBe("2");
    expect(hero.getAttribute("aria-valuetext")).toBe("$2.00 of $5.00");
    expect(hero.querySelector<HTMLElement>(".ui-bgd__fill")!.style.width).toBe("40%");
    expect(hero.querySelector<HTMLElement>(".ui-bgd__notch")!.style.left).toBe("80%");
    expect(el.querySelector(".ui-bgd__pace")!.textContent).toBe("About 6 min to the cap at $0.50/min");
    el.warnAt = 0.9;
    await settle();
    expect(hero.querySelector<HTMLElement>(".ui-bgd__notch")!.style.left).toBe("90%");
    el.status = "paused";
    await settle();
    expect(el.querySelector(".ui-bgd__pace")).toBeNull();
    expect(el.querySelector(".ui-bgd__pill")!.textContent).toBe("Paused");
  });

  test("a change rolls the numbers to the new value", async () => {
    const el = await guard([spend(2)]);
    const big = () => el.querySelector(".ui-bgd__big")!.textContent;
    el.limits = [spend(3)];
    await settle();
    // Read it every frame until it lands: it passes through values between the two (not a jump)
    const seen: (string | null)[] = [];
    for (let i = 0; i < 600 && big() !== "$3.00"; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      seen.push(big());
    }
    expect(big()).toBe("$3.00");
    expect(seen.some((v) => v !== "$2.00" && v !== "$3.00")).toBe(true);
  });

  test("near the cap: the state, the note with the pace and raises, announced once", async () => {
    const el = await guard([spend(2), TOKENS]);
    el.limits = [spend(4.3), TOKENS];
    await settle();
    expect(el.dataset.state).toBe("warn");
    expect(el.querySelector(".ui-bgd__pill")!.textContent).toBe("Near cap");
    const notice = el.querySelector(".ui-bgd__notice")!;
    expect(el.querySelector(".ui-bgd__fold")!.hasAttribute("data-open")).toBe(true);
    expect(notice.getAttribute("data-tone")).toBe("warn");
    expect(notice.querySelector(".ui-bgd__notice-title")!.textContent).toBe("Nearing the spend cap");
    expect(plain(notice.querySelector(".ui-bgd__notice-text")!.textContent)).toBe("$0.70 left – about 1 min to the cap at $0.50/min. The run stops at $5.00.");
    expect([...notice.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["$7.50", "$10", "$15"]);
    expect(notice.querySelector("button")!.getAttribute("aria-label")).toBe("Raise the spend cap to $7.50");
    expect(plain(el.querySelector(".ui-bgd__status")!.textContent)).toBe("Running low$0.70 left");
    expect(plain(el.querySelector('[role="status"]')!.textContent)).toBe("Spend at 86% of the $5.00 cap.");
    expect(el.querySelector(".ui-bgd__track")!.getAttribute("aria-valuetext")).toBe("$4.30 of $5.00, close to the cap");
  });

  test("at the cap: a hard stop – tc-cap-reach once, the stop note, an alert and End run", async () => {
    const el = await guard([spend(4.5), TOKENS]);
    const reached: string[] = [];
    el.addEventListener("tc-cap-reach", (e) => reached.push((e as CustomEvent).detail.id));
    el.limits = [spend(5), TOKENS];
    await settle();
    el.limits = [spend(5), TOKENS];
    await settle();
    expect(reached).toEqual(["spend"]);
    expect(el.dataset.state).toBe("stop");
    expect(el.querySelector(".ui-bgd__pill")!.textContent).toBe("Stopped");
    const notice = el.querySelector(".ui-bgd__notice")!;
    expect(notice.getAttribute("data-tone")).toBe("stop");
    expect(notice.querySelector(".ui-bgd__notice-title")!.textContent).toBe("Stopped at the spend cap");
    expect(el.querySelector('[role="alert"]')!.textContent).toBe("Run stopped: spend reached the $5.00 cap.");
    expect(el.querySelector(".ui-bgd__btn")!.textContent).toBe("End run");
    expect(el.querySelector(".ui-bgd__pace")).toBeNull();
    // A stopped limit outranks one that is only near its cap
    el.limits = [spend(5), { ...TOKENS, used: 249_000 }];
    await settle();
    expect(el.querySelector(".ui-bgd__notice-title")!.textContent).toBe("Stopped at the spend cap");
  });

  test("a limit that starts at its cap fires tc-cap-reach on the first render; raises over `used` only", async () => {
    const reached: string[] = [];
    document.addEventListener("tc-cap-reach", (e) => reached.push((e as CustomEvent).detail.id), { once: true });
    const el = await guard([{ ...CALLS, used: 40, raiseBy: [5, 20] }]);
    expect(reached).toEqual(["calls"]);
    expect([...el.querySelectorAll(".ui-bgd__chip")].map((b) => b.textContent)).toEqual(["45 calls", "60 calls"]);
    el.limits = [{ ...CALLS, used: 52, cap: 50, raiseBy: [1, 5] }];
    await settle();
    expect([...el.querySelectorAll(".ui-bgd__chip")].map((b) => b.textContent)).toEqual(["55 calls"]);
  });

  test("raising a cap fires a cancelable tc-limits-change; uncontrolled it applies, the note folds and focus goes to the status", async () => {
    const el = await guard([spend(4.6), TOKENS]);
    const seen: unknown[] = [];
    el.addEventListener("tc-limits-change", (e) => {
      const d = (e as CustomEvent).detail;
      seen.push({ id: d.id, cap: d.cap, previous: d.previous, caps: d.limits.map((l: BudgetLimit) => l.cap) });
    });
    const first = el.querySelector<HTMLButtonElement>(".ui-bgd__chip")!;
    first.focus();
    first.click();
    await settle();
    expect(seen).toEqual([{ id: "spend", cap: 7.5, previous: 5, caps: [7.5, 250_000] }]);
    expect(el.limits[0].cap).toBe(7.5);
    expect(el.dataset.state).toBe("ok");
    expect(el.querySelector(".ui-bgd__fold")!.hasAttribute("data-open")).toBe(false);
    expect(el.querySelector<HTMLElement>(".ui-bgd__fold")!.inert).toBe(true);
    await wait(50);
    expect(document.activeElement).toBe(el.querySelector(".ui-bgd__status"));
    expect(plain(el.querySelector('[role="status"]')!.textContent)).toBe("Spend cap raised to $7.50.");
  });

  test("controlled: preventDefault keeps the cap until the app passes it back", async () => {
    const el = await guard([spend(5), TOKENS]);
    el.addEventListener("tc-limits-change", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-bgd__chip")!.click();
    await settle();
    expect(el.limits[0].cap).toBe(5);
    expect(el.dataset.state).toBe("stop");
    el.limits = [spend(5, { cap: 7.5 }), TOKENS];
    await settle();
    expect(el.dataset.state).toBe("ok");
  });

  test("Stop run fires tc-stop with the state; a finished run has no button", async () => {
    const el = await guard([spend(4.2)]);
    const stops: string[] = [];
    el.addEventListener("tc-stop", (e) => stops.push((e as CustomEvent).detail.state));
    const btn = el.querySelector<HTMLButtonElement>(".ui-bgd__btn")!;
    expect(btn.textContent).toBe("Stop run");
    btn.click();
    expect(stops).toEqual(["warn"]);
    el.status = "done";
    el.limits = [spend(3)];
    await settle();
    expect(el.querySelector(".ui-bgd__btn")).toBeNull();
    expect(el.querySelector(".ui-bgd__pill")!.textContent).toBe("Done");
    await expect.poll(() => plain(el.querySelector(".ui-bgd__status")!.textContent), { timeout: 3000 }).toBe("Finished under budget$2.00 left");
  });

  test("tokens, currencies and locales", async () => {
    const el = await fixture<TcBudgetGuard>(
      html`<tc-budget-guard locale="de-DE" currency="EUR" .limits=${[spend(2.5), { ...TOKENS, used: 2_400_000, cap: 3_000_000, rate: 120_000 }]}></tc-budget-guard>`,
    );
    expect(plain(el.querySelector(".ui-bgd__big")!.textContent)).toBe("2,50 €");
    expect(plain(el.querySelector(".ui-bgd__limit-value")!.textContent)).toBe("2.400k of 3.000k tokens");
    expect(plain(el.querySelector(".ui-bgd__pace")!.textContent)).toBe("About 5 min to the cap at 0,50 €/min");
    const empty = await fixture<TcBudgetGuard>(html`<tc-budget-guard></tc-budget-guard>`);
    expect(empty.querySelector(".ui-bgd__empty")!.textContent).toBe("No limits set for this run");
  });

  test("the wrapper: uncontrolled limits survive a parent re-render; callbacks fire", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: unknown[] = [];
    let rerender!: (n: number) => void;
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(BudgetGuard, {
        title: `Budget ${n}`,
        defaultLimits: [spend(5)],
        onRaise: (id, cap, previous) => calls.push(["raise", id, cap, previous]),
        onCapReach: (id) => calls.push(["reach", id]),
        onStop: (st) => calls.push(["stop", st]),
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-budget-guard")!;
    el.querySelector<HTMLButtonElement>(".ui-bgd__chip")!.click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(el.querySelector("h3")!.textContent).toBe("Budget 1");
    expect(el.limits[0].cap).toBe(7.5);
    el.querySelector<HTMLButtonElement>(".ui-bgd__btn")!.click();
    expect(calls).toEqual([["reach", "spend"], ["raise", "spend", 7.5, 5], ["stop", "ok"]]);
    await act(async () => root.unmount());
  });

  test("the wrapper: controlled limits only report", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: number[] = [];
    await act(async () => root.render(React.createElement(BudgetGuard, { limits: [spend(5)], onLimitsChange: (l) => seen.push(l[0].cap) })));
    await settle();
    const el = host.querySelector("tc-budget-guard")!;
    el.querySelector<HTMLButtonElement>(".ui-bgd__chip")!.click();
    await act(async () => settle());
    expect(seen).toEqual([7.5]);
    expect(el.limits[0].cap).toBe(5);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10" : ""}>
        <tc-budget-guard task="Standard, ok" .limits=${[spend(2), TOKENS, CALLS]}></tc-budget-guard>
        <tc-budget-guard heading="Warn" .limits=${[spend(4.4), TOKENS]}></tc-budget-guard>
        <tc-budget-guard look="clean" heading="Stop" status="paused" .limits=${[spend(5), TOKENS]}></tc-budget-guard>
        <tc-budget-guard look="clean" heading="Clean warn" .limits=${[spend(4.4), CALLS]}></tc-budget-guard>
      </div>`);
      await wait(700);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
