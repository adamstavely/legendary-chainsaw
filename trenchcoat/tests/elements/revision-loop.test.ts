/*
 * <tc-revision-loop> in real browsers: the bar and round count, the chart's slots and its words, the remaining issues,
 * opening rounds by click and keyboard, Stop, Accept and Run another round, announcements, narrow, React and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/revision-loop";
import type { RevisionLoopAccept, RevisionLoopExpandedChange, RevisionLoopExtend, RevisionLoopRound, RevisionLoopStop, TcRevisionLoop } from "../../src/elements/revision-loop";
import { RevisionLoop } from "../../src/elements/react/revision-loop";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const BAR = { label: "Rubric score ≥ 8/10", target: 8, unit: "/10", max: 10 };
const ROUNDS: RevisionLoopRound[] = [
  { n: 1, status: "done", score: 5.2, changed: "First draft", critique: ["No summary", "Figures disagree", "Vague"] },
  { n: 2, status: "done", score: 6.6, changed: "Added a summary", critique: ["Figures disagree", "Vague"] },
  { n: 3, status: "running" },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const view = (extra: Partial<TcRevisionLoop> = {}) =>
  fixture<TcRevisionLoop>(html`<tc-revision-loop .bar=${BAR} cap="5" .rounds=${ROUNDS} outcome=${extra.outcome ?? "running"}></tc-revision-loop>`);
const buttons = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-rvl__round")];
const action = (el: Element, name: string) => el.querySelector<HTMLButtonElement>(`[data-action="${name}"]`);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-revision-loop", () => {
  test("heads with the bar, the round it's on and how it stands", async () => {
    const el = await view();
    expect(el.dataset.ui).toBe("rvl");
    expect(text(el.querySelector(".ui-rvl__count"))).toBe("Round 3 of 5");
    expect(text(el.querySelector(".ui-rvl__bar"))).toBe("Bar: Rubric score ≥ 8/10");
    expect(text(el.querySelector(".ui-rvl__outcome"))).toBe("Revising – round 3");
  });

  test("the chart has a slot to the cap, a dot per score and a pending round, and says the scores", async () => {
    const el = await view();
    const ticks = [...el.querySelectorAll(".ui-rvl__tick")].map(text);
    expect(ticks).toEqual(["10", "0", "1", "2", "3", "4", "5"]);
    expect(el.querySelector('.ui-rvl__tick[data-cap]')!.textContent).toBe("5");
    expect(el.querySelectorAll(".ui-rvl__dot")).toHaveLength(2);
    expect(el.querySelector(".ui-rvl__pending")).toBeTruthy();
    expect(el.querySelector(".ui-rvl__plot")!.getAttribute("aria-label")).toBe("Score by round: 5.2/10, 6.6/10. The bar is 8/10.");
  });

  test("the latest critique is what's being worked on, and becomes what remains once it ends", async () => {
    const el = await view();
    expect(text(el.querySelector(".ui-rvl__issues .ui-rvl__section"))).toBe("Working on these (2)");
    expect([...el.querySelectorAll(".ui-rvl__issues .ui-rvl__issue")].map(text)).toEqual(["Figures disagree", "Vague"]);
    el.outcome = "capped";
    await settle();
    expect(text(el.querySelector(".ui-rvl__issues .ui-rvl__section"))).toBe("Remaining issues (2)");
    expect(text(el.querySelector(".ui-rvl__outcome"))).toBe("Stopped at the cap (5 rounds) – 2 issues remain");
  });

  test("met says the round, and a met score is marked", async () => {
    const el = await view();
    el.rounds = [...ROUNDS.slice(0, 2), { n: 3, status: "done", score: 8.2, critique: [] }];
    el.outcome = "met";
    await settle();
    expect(text(el.querySelector(".ui-rvl__outcome"))).toBe("Met the bar in round 3");
    expect(el.querySelectorAll(".ui-rvl__dot[data-met]")).toHaveLength(1);
    expect(text(el.querySelector(".ui-rvl__issues .ui-rvl__empty"))).toBe("No issues left");
  });

  test("rounds list newest first, with the score and its change in words", async () => {
    const el = await view();
    const rows = [...el.querySelectorAll(".ui-rvl__row")];
    expect(text(rows[0])).toContain("Round 3");
    expect(text(rows[0])).toContain("Revising…");
    expect(rows[0]!.querySelector("button")).toBeNull();
    expect(text(buttons(el)[0]!.querySelector(".ui-rvl__score"))).toBe("6.6/10");
    expect(text(buttons(el)[0]!.querySelector(".ui-rvl__delta"))).toContain("+1.4 on the round before");
    expect(buttons(el)[1]!.querySelector(".ui-rvl__delta")).toBeNull();
  });

  test("opening a round shows what changed and the critique, and reports it", async () => {
    const el = await view();
    const seen: RevisionLoopExpandedChange[] = [];
    el.addEventListener("tc-expanded-change", (e) => seen.push((e as CustomEvent<RevisionLoopExpandedChange>).detail));
    buttons(el)[1]!.click();
    await settle();
    expect(seen[0]!.expanded).toBe(1);
    expect(seen[0]!.round!.score).toBe(5.2);
    expect(buttons(el)[1]!.getAttribute("aria-expanded")).toBe("true");
    const detail = el.querySelector(".ui-rvl__detail")!;
    expect(detail.querySelector(".ui-rvl__detail-label")!.textContent).toBe("What changed");
    expect(detail.querySelector(".ui-rvl__detail-row")!.textContent).toBe("First draft");
    // Open, the round's own line says it once – in the panel, not again in the button
    expect(buttons(el)[1]!.querySelector(".ui-rvl__changed-line")).toBeNull();
    expect(detail.querySelectorAll(".ui-rvl__issue")).toHaveLength(3);
  });

  test("preventDefault keeps a round closed", async () => {
    const el = await view();
    el.addEventListener("tc-expanded-change", (e) => e.preventDefault());
    buttons(el)[0]!.click();
    await settle();
    expect(el.expanded).toBeNull();
  });

  test("the rounds are one tab stop, and the keyboard moves and closes", async () => {
    const el = await view();
    expect(buttons(el).filter((b) => b.tabIndex === 0)).toHaveLength(1);
    buttons(el)[0]!.focus();
    key(buttons(el)[0]!, "ArrowDown");
    await expect.poll(() => document.activeElement).toBe(buttons(el)[1]);
    key(buttons(el)[1]!, "Home");
    await expect.poll(() => document.activeElement).toBe(buttons(el)[0]);
    key(buttons(el)[0]!, "End");
    await expect.poll(() => document.activeElement).toBe(buttons(el)[1]);
    buttons(el)[1]!.click();
    await settle();
    key(buttons(el)[1]!, "Escape");
    await settle();
    expect(el.expanded).toBeNull();
  });

  test("Stop ends the loop, unless prevented", async () => {
    const el = await view();
    let detail: RevisionLoopStop | null = null;
    el.addEventListener("tc-stop", (e) => (detail = (e as CustomEvent<RevisionLoopStop>).detail), { once: true });
    action(el, "stop")!.click();
    await settle();
    expect(detail).toEqual({ round: 3 });
    expect(el.outcome).toBe("stopped");
    expect(text(el.querySelector(".ui-rvl__outcome"))).toBe("Stopped in round 3 – 2 issues remain");
    expect(text(el.querySelector('.ui-rvl__row[data-status="running"]'))).toContain("Stopped");
    const kept = await view();
    kept.addEventListener("tc-stop", (e) => e.preventDefault());
    action(kept, "stop")!.click();
    await settle();
    expect(kept.outcome).toBe("running");
  });

  test("Accept takes the latest result, and shows it's accepted", async () => {
    const el = await view({ outcome: "capped" });
    let detail: RevisionLoopAccept | null = null;
    el.addEventListener("tc-accept", (e) => (detail = (e as CustomEvent<RevisionLoopAccept>).detail));
    expect(action(el, "stop")).toBeNull();
    action(el, "accept")!.click();
    await settle();
    expect(detail).toEqual({ round: 2, score: 6.6 });
    expect(el.accepted).toBe(true);
    expect(text(el.querySelector(".ui-rvl__accepted"))).toBe("Accepted");
    expect(action(el, "accept")).toBeNull();
  });

  test("Run another round is offered only at the cap, and raises it", async () => {
    const el = await view({ outcome: "capped" });
    let detail: RevisionLoopExtend | null = null;
    el.addEventListener("tc-extend", (e) => (detail = (e as CustomEvent<RevisionLoopExtend>).detail));
    action(el, "extend")!.click();
    await settle();
    expect(detail).toEqual({ cap: 6 });
    expect(el.cap).toBe(6);
    expect(el.outcome).toBe("running");
    expect(text(el.querySelector(".ui-rvl__count"))).toBe("Round 3 of 6");
    const stopped = await view({ outcome: "stopped" });
    expect(action(stopped, "extend")).toBeNull();
    const prevented = await view({ outcome: "capped" });
    prevented.addEventListener("tc-extend", (e) => e.preventDefault());
    action(prevented, "extend")!.click();
    await settle();
    expect(prevented.cap).toBe(5);
  });

  test("announces a newly scored round and how it ended, and not the first set", async () => {
    const el = await view();
    const status = () => text(el.querySelector('[role="status"]'));
    expect(status()).toBe("");
    el.rounds = [...ROUNDS.slice(0, 2), { n: 3, status: "done", score: 7.4, critique: ["Vague"] }, { n: 4, status: "running" }];
    await settle();
    expect(status()).toBe("Round 3 scored 7.4/10");
    el.outcome = "stopped";
    await settle();
    expect(status()).toBe("Stopped in round 4 – 1 issue remains");
  });

  test("with no rounds yet, it waits quietly", async () => {
    const el = await fixture<TcRevisionLoop>(html`<tc-revision-loop .bar=${BAR} cap="3"></tc-revision-loop>`);
    expect(text(el.querySelector(".ui-rvl__count"))).toBe("Round 0 of 3");
    expect(el.querySelector(".ui-rvl__dot")).toBeNull();
    expect(el.querySelector(".ui-rvl__plot")!.getAttribute("aria-label")).toContain("no scores yet");
    expect(el.querySelector(".ui-rvl__round-list")).toBeNull();
  });

  test("renamed words", async () => {
    const el = await fixture<TcRevisionLoop>(html`<tc-revision-loop .bar=${BAR} .rounds=${ROUNDS} .labels=${{ roundOf: "Pass {n}/{cap}", stop: "Halt" }}></tc-revision-loop>`);
    expect(text(el.querySelector(".ui-rvl__count"))).toBe("Pass 3/5");
    expect(text(action(el, "stop"))).toBe("Halt");
  });

  test("the chart sits above the issues when narrow, with no overflow", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-revision-loop .bar=${BAR} cap="5" .rounds=${ROUNDS}></tc-revision-loop></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-rvl__grid")!).gridTemplateColumns.split(" ")).toHaveLength(1);
    const card = wrap.querySelector<HTMLElement>(".ui-rvl__card")!;
    expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth + 1);
    const wide = await fixture<HTMLElement>(html`<div style="width: 800px"><tc-revision-loop .bar=${BAR} cap="5" .rounds=${ROUNDS}></tc-revision-loop></div>`);
    expect(getComputedStyle(wide.querySelector(".ui-rvl__grid")!).gridTemplateColumns.split(" ")).toHaveLength(2);
  });
});

describe("React", () => {
  test("an uncontrolled round stays open, and a controlled one stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = (extra = {}) => React.createElement(RevisionLoop, { bar: BAR, cap: 5, rounds: ROUNDS, ...extra });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcRevisionLoop>("tc-revision-loop")!;
    await act(async () => buttons(el)[0]!.click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.expanded).toBe(2);
    await act(async () => root.render(node({ expanded: 1 })));
    await settle();
    await act(async () => buttons(el)[0]!.click());
    await settle();
    expect(el.expanded).toBe(1);
    expect(el.heading).toBe("Revision loop");
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-revision-loop .bar=${BAR} cap="5" .rounds=${ROUNDS} expanded="2"></tc-revision-loop><tc-revision-loop .bar=${BAR} cap="5" .rounds=${ROUNDS.slice(0, 2)} outcome="capped"></tc-revision-loop></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
