/*
 * <tc-subagent-list> in real browsers: the clock and mark helpers, Active and Done groups with counts, rows (names,
 * activity, status words, times), the header and `bare`, the empty state, choosing by click and keyboard with
 * preventDefault, the live clock, announcements, renamed labels, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/subagent-list";
import { subagentClock, subagentMark, subagentShapes, subagentTones, type Subagent, type SubagentSelectedChange, type TcSubagentList } from "../../src/elements/subagent-list";
import { SubagentList } from "../../src/elements/react/subagent-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => cleanup());

const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const NOW = Date.UTC(2026, 10, 8, 15, 0, 0);
const S = 1000;
const M = 60 * S;
const H = 60 * M;
const AGENTS: Subagent[] = [
  { id: "a11y", name: "Review a11y current", status: "waiting", activity: "awaiting command message", startedAt: NOW - 86 * S },
  { id: "cite", name: "Check citations", status: "running", activity: "reading 14 of 40 sources", startedAt: NOW - 3725 * S },
  { id: "sec", name: "Review data security current", status: "done", endedAt: NOW - 20 * S },
  { id: "forms", name: "Fresh forms papers", status: "failed", activity: "the archive didn't answer", endedAt: NOW - 62 * M },
  { id: "bug", name: "Bugbot", status: "stopped", endedAt: NOW - 12 * H },
  { id: "old", name: "Security review", status: "done", endedAt: NOW - 3 * 24 * H },
];

const make = (o: { look?: string; agents?: Subagent[]; now?: number | null; selected?: string | null } = {}) =>
  fixture<TcSubagentList>(
    html`<tc-subagent-list style="width: 360px" look=${o.look ?? "standard"} .agents=${o.agents ?? AGENTS} .now=${o.now === null ? undefined : (o.now ?? NOW)} .selected=${o.selected ?? null}></tc-subagent-list>`,
  );
const rows = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-sba__row")];
const texts = (el: Element, sel: string) => [...el.querySelectorAll(sel)].map((n) => plain(n.textContent));
/** The words as seen – without the screen-reader-only ones */
const visible = (el: Element, sel: string) =>
  [...el.querySelectorAll(sel)].map((n) => {
    const c = n.cloneNode(true) as Element;
    c.querySelectorAll(".tc-sr-only").forEach((x) => x.remove());
    return plain(c.textContent);
  });

describe("helpers", () => {
  test("subagentClock: seconds, minutes and seconds, hours and minutes", () => {
    expect([0, 12 * S, 86 * S, 59 * M + 59 * S, 3725 * S, -5 * S].map(subagentClock)).toEqual(["0s", "12s", "1m 26s", "59m 59s", "1h 2m", "0s"]);
  });

  test("subagentMark: the same seed always draws the same mark, and seeds spread across tones and shapes", () => {
    expect(subagentMark("Review a11y current")).toEqual(subagentMark("Review a11y current"));
    const marks = Array.from({ length: 60 }, (_, i) => subagentMark(`agent-${i}`));
    expect(new Set(marks.map((m) => m.tone)).size).toBe(subagentTones.length);
    expect(new Set(marks.map((m) => m.shape)).size).toBe(subagentShapes.length);
    expect(marks.every((m) => m.parts >= 3 && m.parts <= 8)).toBe(true);
  });
});

describe("tc-subagent-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: Active and Done groups with counts; rows with names, activity, status words and times`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("sba");
      expect(el.dataset.look).toBe(look);
      expect(visible(el, ".ui-sba__label")).toEqual(["Active · 2", "Done · 4"]);
      expect(texts(el, ".ui-sba__name")).toEqual(["Review a11y current", "Check citations", "Review data security current", "Fresh forms papers", "Bugbot", "Security review"]);
      expect(texts(el, ".ui-sba__activity")).toEqual(["Waiting · awaiting command message", "reading 14 of 40 sources", "Failed · the archive didn't answer", "Stopped"]);
      expect(texts(el, ".ui-sba__time")).toEqual(["1m 26s", "1h 2m", "just now", "1h ago", "12h ago", "3d ago"]);
      expect(plain(el.querySelector("h3")!.textContent)).toBe("Subagents");
      expect(plain(el.querySelector(".ui-sba__count")!.textContent)).toBe("2 active");
      const lists = [...el.querySelectorAll("ul")];
      expect(lists.map((u) => plain(document.getElementById(u.getAttribute("aria-labelledby")!)!.textContent))).toEqual(["Active · , 2", "Done · , 4"]);
    });
  }

  test("each row is a button named by its name, state in words, activity and time; marks are decorative and drawn per agent", async () => {
    const el = await make();
    const [waiting, running, done] = rows(el);
    expect(plain(running.textContent)).toBe("Check citations reading 14 of 40 sources , Running, 1h 2m");
    expect(plain(waiting.textContent)).toBe("Review a11y current Waiting · awaiting command message 1m 26s");
    expect(plain(done.textContent)).toBe("Review data security current , Finished, just now");
    const marks = [...el.querySelectorAll<SVGElement>(".ui-sba__mark")];
    expect(marks.every((m) => m.getAttribute("aria-hidden") === "true")).toBe(true);
    const m = subagentMark("a11y");
    expect([marks[0].dataset.tone, marks[0].dataset.shape]).toEqual([m.tone, m.shape]);
  });

  test("one tab stop; arrows move across both groups, Home and End go to the ends", async () => {
    const el = await make();
    expect(rows(el).map((r) => r.tabIndex)).toEqual([0, -1, -1, -1, -1, -1]);
    rows(el)[0].focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("sec");
    expect(rows(el).map((r) => r.tabIndex)).toEqual([-1, -1, 0, -1, -1, -1]);
    await userEvent.keyboard("{End}");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("old");
    await userEvent.keyboard("{Home}{ArrowUp}");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("a11y");
  });

  test("choosing a row by click or Enter fires tc-selected-change and marks it current; preventDefault keeps the old one", async () => {
    const el = await make();
    const seen: SubagentSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<SubagentSelectedChange>).detail));
    rows(el)[2].click();
    await settle(el);
    expect(el.selected).toBe("sec");
    expect(rows(el)[2].getAttribute("aria-current")).toBe("true");
    expect(seen.map((d) => [d.selected, d.agent?.name])).toEqual([["sec", "Review data security current"]]);
    rows(el)[2].focus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await settle(el);
    expect(el.selected).toBe("forms");
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    rows(el)[0].click();
    await settle(el);
    expect(el.selected).toBe("forms");
    expect(rows(el)[0].getAttribute("aria-current")).toBe("false");
  });

  test("the chosen agent holds the tab stop", async () => {
    const el = await make({ selected: "bug" });
    expect(rows(el).find((r) => r.tabIndex === 0)!.dataset.id).toBe("bug");
  });

  test("agents that finish, fail or start waiting are announced; the clock runs from now", async () => {
    const el = await make();
    const status = () => plain(el.querySelector('[role="status"]')!.textContent);
    expect(status()).toBe("");
    el.agents = AGENTS.map((a) => (a.id === "cite" ? { ...a, status: "done" as const, endedAt: NOW } : a.id === "sec" ? { ...a, status: "running" as const, startedAt: NOW } : a));
    await settle(el);
    expect(status()).toBe("Check citations: Finished");
    expect(visible(el, ".ui-sba__label")).toEqual(["Active · 2", "Done · 4"]);
    el.agents = el.agents.map((a) => (a.id === "sec" ? { ...a, status: "failed" as const, endedAt: NOW } : a));
    await settle(el);
    expect(status()).toBe("Review data security current: Failed");
  });

  test("without now, active clocks tick in place", async () => {
    const el = await make({ now: null, agents: [{ id: "x", name: "Live", status: "running", startedAt: Date.now() - 5 * S }] });
    const time = () => el.querySelector(".ui-sba__time")!.textContent!;
    const first = time();
    expect(first).toMatch(/^[5-6]s$/);
    await expect.poll(time, { timeout: 4000 }).not.toBe(first);
  });

  test("bare, no heading and no agents: no header, the empty message", async () => {
    const el = await fixture<TcSubagentList>(html`<tc-subagent-list bare heading=""></tc-subagent-list>`);
    expect(el.querySelector("h3")).toBeNull();
    expect(getComputedStyle(el).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(plain(el.querySelector(".ui-sba__empty")!.textContent)).toBe("No subagents yet");
    expect(rows(el)).toHaveLength(0);
  });

  test("only done agents: no Active group and no count; labels reword it", async () => {
    const el = await fixture<TcSubagentList>(
      html`<tc-subagent-list .now=${NOW} .labels=${{ done: "Fertig", ago: "vor {time}", justNow: "gerade eben" }} .agents=${AGENTS.filter((a) => a.status === "done")}></tc-subagent-list>`,
    );
    expect(visible(el, ".ui-sba__label")).toEqual(["Fertig · 2"]);
    expect(el.querySelector(".ui-sba__count")).toBeNull();
    expect(texts(el, ".ui-sba__time")).toEqual(["gerade eben", "vor 3d"]);
  });

  test("React: uncontrolled selection survives re-renders; controlled stays until the parent changes it", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: (string | null)[] = [];
    let rerender: (n: number) => void = () => {};
    function App({ controlled }: { controlled: boolean }) {
      const [, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(SubagentList, {
        agents: AGENTS,
        now: NOW,
        title: "Helpers",
        ...(controlled ? { selected: "bug" } : { defaultSelected: "a11y" }),
        onSelectedChange: (id) => seen.push(id),
      });
    }
    await act(async () => root.render(React.createElement(App, { controlled: false })));
    await settle();
    let el = host.querySelector<TcSubagentList>("tc-subagent-list")!;
    expect(plain(el.querySelector("h3")!.textContent)).toBe("Helpers");
    expect(el.selected).toBe("a11y");
    await act(async () => rows(el)[3].click());
    await act(async () => rerender(1));
    await settle();
    expect(el.selected).toBe("forms");
    await act(async () => root.render(React.createElement(App, { controlled: true })));
    await settle();
    el = host.querySelector<TcSubagentList>("tc-subagent-list")!;
    expect(el.selected).toBe("bug");
    await act(async () => rows(el)[0].click());
    await settle();
    expect(el.selected).toBe("bug");
    expect(seen).toEqual(["forms", "a11y"]);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-subagent-list .now=${NOW} .agents=${AGENTS} selected="sec"></tc-subagent-list>
        <tc-subagent-list look="clean" .now=${NOW} .agents=${AGENTS}></tc-subagent-list>
        <tc-subagent-list bare heading=""></tc-subagent-list>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
