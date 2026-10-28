/*
 * <tc-digest> in real browsers: the default sections from matters / actions / changes / ignore, the page's own
 * sections, the reading-time estimate, checkable actions with a cancelable tc-done-change, source chips with a
 * cancelable tc-cite-open, the summarising shimmer and its announcement, the React wrapper and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/digest";
import type { DigestCiteOpen, DigestDoneChange, DigestItem, TcDigest } from "../../src/elements/digest";
import { Digest } from "../../src/elements/react/digest";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const MATTERS: DigestItem[] = [{ text: "The deadline moved up one day.", source: { label: "Kickoff notes" } }, { text: "Cost dropped by $3,000.", source: { label: "Budget v4", href: "#budget" } }, "The vendor migration was removed."];
const ACTIONS: DigestItem[] = [{ id: "deck", text: "Send the revised deck by Thursday." }, "Confirm the new budget number."];
const CHANGES: DigestItem[] = ["1 new deadline", "1 corrected number"];
const IGNORE: DigestItem[] = ["Repeated background section"];

const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcDigest>(html`<tc-digest look=${look} description="A week of updates." .matters=${MATTERS} .actions=${ACTIONS} .changes=${CHANGES} .ignore=${IGNORE}></tc-digest>`);
const text = (n: Element) => n.textContent!.replace(/\s+/g, " ").trim();
const checks = (el: Element) => [...el.querySelectorAll<HTMLInputElement>(".ui-dig__check")];

describe("tc-digest", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: four named sections, the actions as checkboxes, Safe to ignore quieter`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("dig");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("One-minute digest");
      const sections = [...el.querySelectorAll<HTMLElement>(".ui-dig__section")];
      expect(sections.map((s) => document.getElementById(s.getAttribute("aria-labelledby")!)!.textContent)).toEqual(["What matters", "What you should do", "What changed", "Safe to ignore"]);
      expect(sections.map((s) => s.hasAttribute("data-quiet"))).toEqual([false, false, false, true]);
      expect(sections[0].querySelectorAll("li")).toHaveLength(3);
      // Each action is a real checkbox with its text as the label
      expect(checks(el)).toHaveLength(2);
      expect(checks(el).map((c) => c.labels![0].textContent)).toEqual(["Send the revised deck by Thursday.", "Confirm the new budget number."]);
      expect(checks(el).map((c) => c.dataset.id)).toEqual(["deck", "actions:1"]);
      // Sources: a button without href, a link with one
      const sources = [...el.querySelectorAll<HTMLElement>(".ui-dig__source")];
      expect(sources.map((s) => [s.tagName, s.textContent])).toEqual([
        ["BUTTON", "Kickoff notes"],
        ["A", "Budget v4"],
      ]);
    });
  }

  test("the estimate: from the words shown at wpm, with a glyph in minutes; overridable", async () => {
    const el = await make();
    const time = () => el.querySelector(".ui-dig__time")?.textContent?.replace(/\s+/g, " ").trim();
    // About 50 words at 238 a minute → ~15 sec
    expect(time()).toMatch(/^~\d+ sec to read$/);
    const secs = Number(time()!.match(/\d+/)![0]);
    expect(secs % 5).toBe(0);
    el.wpm = 30;
    await settle();
    expect(time()).toMatch(/^~\d+ min to read$/);
    expect(el.querySelector(".ui-dig__glyph")!.textContent).toMatch(/^\dm$/);
    el.estimate = "~1 min";
    await settle();
    expect(time()).toBe("~1 min to read");
  });

  test("ticking an action fires a cancelable tc-done-change; prevented, the box goes back", async () => {
    const el = await make();
    const seen: DigestDoneChange[] = [];
    el.addEventListener("tc-done-change", (e) => seen.push((e as CustomEvent<DigestDoneChange>).detail));
    checks(el)[0].click();
    await settle();
    expect(el.done).toEqual(["deck"]);
    expect(checks(el)[0].closest("li")!.hasAttribute("data-done")).toBe(true);
    checks(el)[0].click();
    await settle();
    expect(el.done).toEqual([]);
    expect(seen).toEqual([
      { done: ["deck"], id: "deck", checked: true },
      { done: [], id: "deck", checked: false },
    ]);
    el.addEventListener("tc-done-change", (e) => e.preventDefault());
    checks(el)[1].click();
    await settle();
    expect(el.done).toEqual([]);
    await expect.poll(() => checks(el)[1].checked).toBe(false);
  });

  test("source chips fire a cancelable tc-cite-open; prevented, a link doesn't navigate", async () => {
    const el = await make();
    const seen: DigestCiteOpen[] = [];
    el.addEventListener("tc-cite-open", (e) => {
      seen.push((e as CustomEvent<DigestCiteOpen>).detail);
      e.preventDefault();
    });
    const before = location.hash;
    const [button, link] = [...el.querySelectorAll<HTMLElement>(".ui-dig__source")];
    button.click();
    link.click();
    expect(location.hash).toBe(before);
    expect(seen).toEqual([
      { id: "matters:0", section: "matters", source: { label: "Kickoff notes" } },
      { id: "matters:1", section: "matters", source: { label: "Budget v4", href: "#budget" } },
    ]);
  });

  test("summarising: a shimmer in place of the sections, busy, and 'ready' announced when done", async () => {
    const el = await make();
    el.status = "summarising";
    await settle();
    expect(el.querySelectorAll(".ui-dig__section--skeleton")).toHaveLength(4);
    expect(el.querySelector(".ui-dig__card")!.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelector(".ui-dig__time")).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Summarising");
    el.status = "done";
    await expect.poll(() => el.querySelector('[role="status"]')!.textContent).toBe("One-minute digest ready");
    expect(el.querySelector(".ui-dig__card")!.hasAttribute("aria-busy")).toBe(false);
    expect(el.querySelectorAll(".ui-dig__section")).toHaveLength(4);
  });

  test("the page's own sections replace the defaults; empty ones are left out; nothing at all says so", async () => {
    const el = await make();
    el.sections = [
      { id: "decisions", label: "Decided", items: ["Launch on Thursday"] },
      { id: "open", label: "Still open", items: [] },
      { id: "next", label: "Next", items: [{ id: "book", text: "Book the room" }], checkable: true },
    ];
    await settle();
    expect([...el.querySelectorAll(".ui-dig__label")].map((l) => l.textContent)).toEqual(["Decided", "Next"]);
    expect(checks(el).map((c) => c.dataset.id)).toEqual(["book"]);
    el.sections = [];
    await settle();
    expect(text(el.querySelector(".ui-dig__empty")!)).toBe("Nothing to digest yet.");
    expect(el.querySelector(".ui-dig__time")).toBeNull();
  });

  test("React wrapper: done is controlled; onCiteOpen returning false keeps a link from opening", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[][] = [];
    const cited: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(Digest, {
          title: "Catch-up",
          matters: MATTERS,
          actions: ACTIONS,
          done: [],
          onDoneChange: (d) => void asked.push(d),
          onCiteOpen: (_id, _section, source) => {
            cited.push(source.label);
            return false;
          },
        }),
      ),
    );
    await settle();
    const el = host.querySelector("tc-digest")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Catch-up");
    checks(el)[0].click();
    await settle();
    expect(asked).toEqual([["deck"]]);
    expect(el.done).toEqual([]);
    const before = location.hash;
    el.querySelector<HTMLAnchorElement>("a.ui-dig__source")!.click();
    expect(location.hash).toBe(before);
    expect(cited).toEqual(["Budget v4"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-digest description="A week of updates." .matters=${MATTERS} .actions=${ACTIONS} .changes=${CHANGES} .ignore=${IGNORE} .done=${["deck"]}></tc-digest>
        <tc-digest look="clean" .matters=${MATTERS} .actions=${ACTIONS} .ignore=${IGNORE}></tc-digest>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
