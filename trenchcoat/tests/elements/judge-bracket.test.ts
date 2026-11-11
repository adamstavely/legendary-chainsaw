/*
 * <tc-judge-bracket> in real browsers: the host and both looks, the bracket's seeding and byes, verdicts filling it,
 * the comparison, the champion and "Use this answer", the keyboard, announcements, the narrow layout, the React
 * wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/judge-bracket";
import { buildBracket, TcJudgeBracket, type JudgeAttempt, type JudgeMatch } from "../../src/elements/judge-bracket";
import { JudgeBracket } from "../../src/elements/react/judge-bracket";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ATTEMPTS: JudgeAttempt[] = "abcdefgh".split("").map((c, i) => ({ id: c, label: `Attempt ${c.toUpperCase()}`, model: i % 2 ? "Model two" : "Model one", summary: `Summary ${c.toUpperCase()}`, score: 50 + i * 5 }));
const ROUND1: JudgeMatch[] = [
  { round: 1, a: "a", b: "b", winner: "a", confidence: 0.86, reason: "A has the numbers." },
  { round: 1, a: "d", b: "c", winner: "c", confidence: 0.9 },
  { round: 1, a: "e", b: "f", winner: "e" },
  { round: 1, a: "g", b: "h", winner: "h" },
];
const looks = ["standard", "clean"] as const;
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

const make = (o: { look?: string; attempts?: JudgeAttempt[]; verdicts?: JudgeMatch[]; width?: number } = {}) =>
  fixture<TcJudgeBracket>(
    html`<tc-judge-bracket
      look=${o.look ?? "standard"}
      task="Summarise the findings"
      style=${`width: ${o.width ?? 1100}px`}
      .attempts=${o.attempts ?? ATTEMPTS}
      .verdicts=${o.verdicts ?? ROUND1}
    ></tc-judge-bracket>`,
  );
const matchEl = (el: Element, key: string) => el.querySelector<HTMLButtonElement>(`.ui-jbk__match[data-key="${key}"]`)!;
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);

describe("buildBracket", () => {
  test("eight attempts: three rounds, first-round pairs in seeding order, winners moving on", () => {
    const r = buildBracket(ATTEMPTS, ROUND1);
    expect(r.map((row) => row.length)).toEqual([4, 2, 1]);
    expect(r[0].map((s) => [s.a, s.b])).toEqual([["a", "b"], ["c", "d"], ["e", "f"], ["g", "h"]]);
    // A verdict naming the pair the other way round still counts
    expect(r[0][1].winner).toBe("c");
    expect(r[1].map((s) => [s.a, s.b, s.state])).toEqual([["a", "c", "upcoming"], ["e", "h", "upcoming"]]);
    expect(r[2][0].state).toBe("waiting");
  });

  test("byes go to the first attempts when there aren't a power of two; a verdict that fits nowhere is ignored", () => {
    const five = ATTEMPTS.slice(0, 5);
    const r = buildBracket(five, [{ round: 1, a: "d", b: "e", winner: "e" }, { round: 1, a: "a", b: "c", winner: "a" }]);
    expect(r[0].map((s) => s.state)).toEqual(["bye", "bye", "bye", "decided"]);
    expect(r[0].map((s) => s.winner)).toEqual(["a", "b", "c", "e"]);
    expect(r[1].map((s) => [s.a, s.b])).toEqual([["a", "b"], ["c", "e"]]);
    expect(buildBracket(ATTEMPTS.slice(0, 3), []).map((row) => row.map((s) => [s.a, s.b]))).toEqual([[["a", null], ["b", "c"]], [["a", null]]]);
    expect(buildBracket(ATTEMPTS.slice(0, 1), [])).toEqual([]);
    // A match without a winner yet is being judged
    expect(buildBracket(ATTEMPTS.slice(0, 2), [{ round: 1, a: "a", b: "b" }])[0][0].state).toBe("judging");
  });
});

describe("tc-judge-bracket", () => {
  for (const look of looks) {
    test(`${look}: the host, the header with the count, and one tab stop`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("jbk");
      expect(el.dataset.look).toBe(look);
      expect(plain(el.querySelector(".tc-head__title")!.textContent)).toBe("Judge's bracket");
      expect(plain(el.querySelector(".tc-head__sub")!.textContent)).toBe("Summarise the findings");
      expect(plain(el.querySelector(".tc-head__aside")!.textContent)).toBe("4 of 7 judged");
      const buttons = [...el.querySelectorAll<HTMLElement>(".ui-jbk__match")];
      expect(buttons).toHaveLength(7);
      expect(buttons.filter((b) => b.tabIndex === 0)).toHaveLength(1);
      expect([...el.querySelectorAll(".ui-jbk__rname")].map((h) => plain(h.textContent))).toEqual(["Round 1", "Semi-final", "Final"]);
    });
  }

  test("winners and losers, the upcoming matches, and a match that's being judged", async () => {
    const el = await make();
    const entries = (key: string) => [...matchEl(el, key).querySelectorAll<HTMLElement>(".ui-jbk__entry")];
    expect(entries("1-1").map((e) => e.dataset.outcome)).toEqual(["won", "lost"]);
    expect(plain(matchEl(el, "1-1").textContent)).toContain("Round 1, match 1: Attempt A");
    expect(matchEl(el, "2-1").dataset.state).toBe("upcoming");
    expect(plain(entries("3-1")[0].textContent)).toBe("Waiting for the winner of semi-final match 1");
    el.verdicts = [...ROUND1, { round: 2, a: "c", b: "a" }];
    await settle();
    expect(matchEl(el, "2-1").dataset.state).toBe("judging");
    expect(plain(matchEl(el, "2-1").textContent)).toContain("Judging…");
    expect(el.querySelector(".ui-jbk__champ")!.hasAttribute("data-empty")).toBe(true);
  });

  test("new verdicts: the winner moves on and is announced; the champion's card fills", async () => {
    const el = await make();
    el.verdicts = [...ROUND1, { round: 2, a: "a", b: "c", winner: "c", reason: "C ranks by risk." }];
    await settle();
    expect(status(el)).toBe("Attempt C beats Attempt A in the semi-final");
    expect(el.querySelector('.ui-jbk__wire[data-new]')).not.toBeNull();
    expect(matchEl(el, "3-1").querySelector(".ui-jbk__entry[data-new]")).not.toBeNull();
    el.verdicts = [...el.verdicts, { round: 2, a: "e", b: "h", winner: "e" }, { round: 3, a: "c", b: "e", winner: "c" }];
    await settle();
    expect(status(el)).toBe("Attempt E beats Attempt H in the semi-final. Attempt C wins the bracket");
    const champ = el.querySelector(".ui-jbk__champ")!;
    expect(champ.hasAttribute("data-empty")).toBe(false);
    expect(plain(champ.textContent)).toContain("Champion: Attempt C");
    expect(plain(champ.textContent)).toContain("Summary C");
  });

  test("Use this answer: a cancelable tc-accept; prevented nothing changes, else it's in use and focus stays on it", async () => {
    const el = await make({ verdicts: [...ROUND1, { round: 2, a: "a", b: "c", winner: "c" }, { round: 2, a: "e", b: "h", winner: "e" }, { round: 3, a: "c", b: "e", winner: "c" }] });
    const seen: unknown[] = [];
    const block = (e: Event) => e.preventDefault();
    el.addEventListener("tc-accept", (e) => seen.push((e as CustomEvent).detail.id));
    el.addEventListener("tc-accept", block);
    el.querySelector<HTMLButtonElement>("button.ui-jbk__use")!.click();
    await settle();
    expect(el.accepted).toBeNull();
    el.removeEventListener("tc-accept", block);
    el.querySelector<HTMLButtonElement>("button.ui-jbk__use")!.click();
    await settle();
    expect(seen).toEqual(["c", "c"]);
    expect(el.accepted).toBe("c");
    const inUse = el.querySelector(".ui-jbk__use[data-on]")!;
    expect(plain(inUse.textContent)).toBe("In use");
    expect(document.activeElement).toBe(inUse);
    expect(status(el)).toBe("Using Attempt C");
  });

  test("opening a match: the comparison with the reason and confidence; Close and Escape return focus", async () => {
    const el = await make();
    const events: unknown[] = [];
    el.addEventListener("tc-match-change", (e) => events.push((e as CustomEvent).detail));
    matchEl(el, "1-1").click();
    await settle();
    expect(el.match).toBe("1-1");
    expect(events).toEqual([{ match: "1-1", item: ROUND1[0] }]);
    const panel = el.querySelector(".ui-jbk__panel")!;
    expect(matchEl(el, "1-1").getAttribute("aria-expanded")).toBe("true");
    expect(matchEl(el, "1-1").getAttribute("aria-controls")).toBe(panel.id);
    expect(plain(panel.querySelector(".ui-jbk__ptitle")!.textContent)).toBe("Round 1 · match 1");
    expect([...panel.querySelectorAll<HTMLElement>(".ui-jbk__side")].map((s) => s.dataset.outcome)).toEqual(["won", "lost"]);
    expect(plain(panel.querySelector(".ui-jbk__reason")!.textContent)).toBe("The judge's reason A has the numbers.");
    expect(plain(panel.querySelector(".ui-jbk__conf-text")!.textContent)).toBe("86% confident");
    panel.querySelector<HTMLButtonElement>(".ui-jbk__close")!.click();
    await settle();
    expect(el.match).toBeNull();
    expect(document.activeElement).toBe(matchEl(el, "1-1"));
    // Escape from the match closes it again
    matchEl(el, "2-1").click();
    await settle();
    expect(plain(el.querySelector(".ui-jbk__note")!.textContent)).toBe("Up next");
    matchEl(el, "2-1").focus();
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(el.match).toBeNull();
    // Prevented, the match stays as it was
    el.addEventListener("tc-match-change", (e) => e.preventDefault());
    matchEl(el, "1-2").click();
    await settle();
    expect(el.match).toBeNull();
    expect(el.querySelector(".ui-jbk__panel")).toBeNull();
  });

  test("keyboard: ↑ ↓ within a round, → to the match it feeds, ← back, Home and End", async () => {
    const el = await make();
    matchEl(el, "1-1").focus();
    const at = () => (document.activeElement as HTMLElement).dataset.key;
    await userEvent.keyboard("{ArrowDown}");
    expect(at()).toBe("1-2");
    await userEvent.keyboard("{ArrowRight}");
    expect(at()).toBe("2-1");
    await userEvent.keyboard("{ArrowRight}");
    expect(at()).toBe("3-1");
    await userEvent.keyboard("{ArrowLeft}");
    expect(at()).toBe("2-1");
    await userEvent.keyboard("{ArrowLeft}");
    expect(at()).toBe("1-1");
    await userEvent.keyboard("{End}");
    expect(at()).toBe("1-4");
    await userEvent.keyboard("{ArrowUp}");
    expect(at()).toBe("1-3");
    await userEvent.keyboard("{Home}");
    expect(at()).toBe("1-1");
    await settle();
    expect([...el.querySelectorAll<HTMLElement>(".ui-jbk__match")].filter((b) => b.tabIndex === 0).map((b) => b.dataset.key)).toEqual(["1-1"]);
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(el.match).toBe("1-1");
  });

  test("narrow: the rounds stack under the path, the connectors go; no attempts says so", async () => {
    const el = await make({ width: 380 });
    expect(getComputedStyle(el.querySelector(".ui-jbk__path")!).display).toBe("flex");
    expect([...el.querySelectorAll(".ui-jbk__path li")].map((li) => plain(li.textContent))).toEqual(["Round 1", "Semi-final", "Final"]);
    expect(getComputedStyle(el.querySelector(".ui-jbk__wires")!).display).toBe("none");
    expect(getComputedStyle(el.querySelector(".ui-jbk__slot")!).position).toBe("static");
    expect(el.scrollWidth).toBeLessThanOrEqual(380);
    el.attempts = [];
    await settle();
    expect(plain(el.querySelector(".ui-jbk__empty")!.textContent)).toBe("Add two or more attempts to judge.");
  });

  test("the wrapper: an uncontrolled match survives a parent re-render; a controlled one stays until the parent changes it", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement("div", null,
        React.createElement(JudgeBracket, { title: `Bracket ${n}`, attempts: ATTEMPTS, verdicts: ROUND1, onMatchChange: (m, item) => calls.push(`u:${m}:${item?.winner ?? "-"}`) }),
        React.createElement(JudgeBracket, { attempts: ATTEMPTS, verdicts: ROUND1, match: null, onMatchChange: (m) => calls.push(`c:${m}`) }),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const [free, held] = [...host.querySelectorAll<TcJudgeBracket>("tc-judge-bracket")];
    matchEl(free, "1-2").click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(plain(free.querySelector(".tc-head__title")!.textContent)).toBe("Bracket 1");
    expect(free.match).toBe("1-2");
    matchEl(held, "1-1").click();
    await act(async () => settle());
    expect(held.match).toBeNull();
    expect(calls).toEqual(["u:1-2:c", "c:1-1"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look, with a comparison open and a champion (${theme})`, async () => {
      const done = [...ROUND1, { round: 2, a: "a", b: "c", winner: "c", reason: "C ranks by risk.", confidence: 0.7 }, { round: 2, a: "e", b: "h" }];
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-judge-bracket style="width: 1100px" task="Summarise" .attempts=${ATTEMPTS} .verdicts=${done} match="2-1"></tc-judge-bracket>
        <tc-judge-bracket look="clean" style="width: 1100px" .attempts=${ATTEMPTS.slice(0, 5)} .verdicts=${[{ round: 1, a: "d", b: "e", winner: "e" }, { round: 2, a: "a", b: "b", winner: "a" }, { round: 2, a: "c", b: "e", winner: "c" }, { round: 3, a: "a", b: "c", winner: "a" }]} match="1-4"></tc-judge-bracket>
        <tc-judge-bracket look="clean" style="width: 380px" .attempts=${ATTEMPTS.slice(0, 4)} .verdicts=${[]}></tc-judge-bracket>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
