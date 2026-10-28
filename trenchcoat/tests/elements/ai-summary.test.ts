/*
 * <tc-ai-summary> in real browsers: the header's counts and AI-generated tag, idle → summarising (shimmer, then the
 * TL;DR and streamed text) → done, error with Retry, source chips with their tooltip and links, open questions, the
 * freshness banner, feedback, Short / Detailed, Sources, Copy and Regenerate, the own clock, polite announcements, the
 * React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/ai-summary";
import { aiSummaryAgo, type AiSummaryCiteOpen, type AiSummaryPoint, type AiSummarySource, type TcAiSummary } from "../../src/elements/ai-summary";
import { AiSummary } from "../../src/elements/react/ai-summary";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const NOW = Date.UTC(2026, 9, 28, 15, 0);
const MIN = 60_000;
const SOURCES: AiSummarySource[] = [
  { id: "m1", label: "Priya in #launch", kind: "message", at: NOW - 90 * MIN },
  { id: "m2", label: "Marco in #launch", kind: "message", at: NOW - 80 * MIN },
  { id: "d1", label: "Launch checklist", kind: "document", href: "/docs/checklist", at: NOW - 200 * MIN },
  { id: "t1", label: "BILL-482", kind: "ticket", at: NOW - 30 * MIN },
];
const POINTS: AiSummaryPoint[] = [
  { id: "date", text: "Launch on 12 November.", sources: ["m1", "d1"] },
  { id: "bug", text: "A billing bug blocks it.", sources: ["t1", "gone"] },
];
const SUMMARY = "The team agreed a date.\n\nOne bug blocks it.";

const make = (look: "standard" | "clean" = "standard", status = "done", extra: Partial<TcAiSummary> = {}) =>
  fixture<TcAiSummary>(html`<tc-ai-summary
    look=${look}
    status=${status}
    subject="#launch"
    model="Claude Sonnet"
    .now=${NOW}
    .generatedAt=${NOW - 12 * MIN}
    .sources=${SOURCES}
    .tldr=${status === "done" ? "Launch is set for 12 November." : ""}
    .summary=${status === "done" ? SUMMARY : ""}
    .points=${status === "done" ? POINTS : []}
    .questions=${status === "done" ? ["Who signs off the fix?"] : []}
  ></tc-ai-summary>`).then(async (el) => {
    Object.assign(el, extra);
    await settle();
    return el;
  });
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const button = (el: Element, name: string) => [...el.querySelectorAll<HTMLElement>("button, a")].find((b) => b.textContent!.trim() === name)!;
const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, " ").trim();

describe("tc-ai-summary", () => {
  test("relative times: just now, minutes, hours, then the date", () => {
    expect(aiSummaryAgo(NOW - 10_000, NOW)).toBe("just now");
    expect(aiSummaryAgo(NOW - 12 * MIN, NOW)).toBe("12 min ago");
    expect(aiSummaryAgo(NOW - 150 * MIN, NOW)).toBe("2 h ago");
    expect(aiSummaryAgo(NOW - 3 * 24 * 60 * MIN, NOW, "en-GB")).toBe("25 Oct");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the header counts the sources by kind and marks the summary AI-generated; the TL;DR, summary, points and questions show when done`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("aism");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".tc-head__title"))).toBe("Summary");
      expect(text(el.querySelector(".ui-aism__about"))).toBe("#launch · 2 messages · 1 document · 1 ticket");
      expect(text(el.querySelector(".ui-aism__ai"))).toBe("AI-generatedClaude Sonnet · 12 min ago");
      expect(text(el.querySelector(".ui-aism__tldr"))).toBe("TL;DR Launch is set for 12 November.");
      expect([...el.querySelectorAll(".ui-aism__p")].map((p) => p.textContent)).toEqual(["The team agreed a date.", "One bug blocks it."]);
      expect(el.querySelectorAll(".ui-aism__points")[0].querySelectorAll(".ui-aism__point")).toHaveLength(2);
      // Chips are numbered by the source's place in `sources`; a source that isn't there gets no chip
      expect([...el.querySelectorAll(".ui-aism__cite")].map((c) => c.querySelector('[aria-hidden="true"]')!.textContent)).toEqual(["1", "3", "4"]);
      expect(text(el.querySelector(".ui-aism__cite .tc-sr-only"))).toBe("Source 1: Priya in #launch");
      expect(text(el.querySelectorAll(".ui-aism__section")[1].querySelector(".ui-aism__caption"))).toBe("Open questions");
      expect(text(el.querySelector(".ui-aism__question .ui-aism__point-text"))).toBe("Who signs off the fix?");
      expect(el.querySelector(".ui-aism__stale")).toBeNull();
    });
  }

  test("idle offers Summarise; summarising shows a shimmer, then the TL;DR and streamed text with a caret; done and error are announced", async () => {
    const el = await make("standard", "idle");
    const asked = vi.fn();
    el.addEventListener("tc-summarise", asked);
    expect(el.querySelector(".ui-aism__foot")).toBeNull();
    expect(text(el.querySelector(".ui-aism__idle-text"))).toContain("of 2 messages · 1 document · 1 ticket");
    button(el, "Summarise").click();
    expect(asked).toHaveBeenCalledTimes(1);
    el.status = "summarising";
    await expect.poll(() => el.querySelector(".ui-aism__skeleton")).toBeTruthy();
    expect(status(el)).toBe("Summarising #launch");
    expect((el.querySelector(".ui-aism__copy") as HTMLButtonElement).disabled).toBe(true);
    expect((el.querySelector('.ui-aism__thumb[data-value="up"]') as HTMLButtonElement).disabled).toBe(true);
    el.tldr = "Launch is set";
    await expect.poll(() => text(el.querySelector(".ui-aism__tldr-text"))).toBe("Launch is set");
    expect(el.querySelector(".ui-aism__skeleton")).toBeNull();
    expect(el.querySelector(".ui-aism__tldr .ui-aism__caret")).toBeTruthy();
    el.summary = "The team agreed";
    await expect.poll(() => el.querySelector(".ui-aism__p")?.textContent).toBe("The team agreed");
    expect(el.querySelector(".ui-aism__tldr .ui-aism__caret")).toBeNull();
    expect(el.querySelector(".ui-aism__p .ui-aism__caret")).toBeTruthy();
    expect(el.querySelector(".ui-aism__summary")!.getAttribute("aria-busy")).toBe("true");
    el.status = "done";
    await expect.poll(() => status(el)).toBe("Summary of #launch ready");
    expect(el.querySelector(".ui-aism__caret")).toBeNull();
    expect((el.querySelector(".ui-aism__copy") as HTMLButtonElement).disabled).toBe(false);
    el.error = "The model timed out.";
    el.status = "error";
    await expect.poll(() => status(el)).toBe("Couldn't summarise #launch: The model timed out.");
    expect(text(el.querySelector('[role="alert"]'))).toContain("The model timed out.");
    const retried: string[] = [];
    el.addEventListener("tc-retry", (e) => retried.push((e as CustomEvent<{ reason: string }>).detail.reason));
    button(el, "Retry").click();
    expect(retried).toEqual(["error"]);
  });

  test("a source chip shows its source on hover or focus, Escape hides it; it fires a cancelable tc-cite-open and links when the source has an href", async () => {
    const el = await make();
    const cites: AiSummaryCiteOpen[] = [];
    el.addEventListener("tc-cite-open", (e) => {
      cites.push((e as CustomEvent<AiSummaryCiteOpen>).detail);
      e.preventDefault();
    });
    const [first, second] = el.querySelectorAll<HTMLElement>(".ui-aism__cite");
    expect(first.tagName).toBe("BUTTON");
    expect(second.tagName).toBe("A");
    expect(second.getAttribute("href")).toBe("/docs/checklist");
    first.dispatchEvent(new PointerEvent("pointerenter"));
    await expect.poll(() => text(el.querySelector(".ui-aism__tip"))).toBe("Priya in #launch");
    expect(el.querySelector(".ui-aism__tip")!.getAttribute("aria-hidden")).toBe("true");
    first.dispatchEvent(new PointerEvent("pointerleave"));
    await expect.poll(() => el.querySelector(".ui-aism__tip")).toBeNull();
    second.focus();
    await expect.poll(() => text(el.querySelector(".ui-aism__tip"))).toBe("Launch checklist");
    second.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await expect.poll(() => el.querySelector(".ui-aism__tip")).toBeNull();
    first.click();
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    second.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(cites).toEqual([
      { sourceId: "m1", pointId: "date" },
      { sourceId: "d1", pointId: "date" },
    ]);
  });

  test("freshness: sources dated after the summary, or `stale`, show a banner with Update", async () => {
    const el = await make();
    el.sources = [...SOURCES, { id: "m9", label: "Lena in #launch", kind: "message", at: NOW - 2 * MIN }, { id: "m10", label: "Jo in #launch", kind: "message", at: NOW - MIN }];
    await expect.poll(() => text(el.querySelector(".ui-aism__stale-text"))).toBe("2 new messages since this summary");
    const retried: string[] = [];
    el.addEventListener("tc-retry", (e) => retried.push((e as CustomEvent<{ reason: string }>).detail.reason));
    button(el, "Update").click();
    expect(retried).toEqual(["stale"]);
    // Mixed kinds are "sources"; a count given in `stale` wins; `stale-label` replaces the words
    el.sources = [...SOURCES, { id: "x", label: "Spec", kind: "document", at: NOW - MIN }, { id: "y", label: "Jo", kind: "message", at: NOW - MIN }];
    await expect.poll(() => text(el.querySelector(".ui-aism__stale-text"))).toBe("2 new sources since this summary");
    el.sources = SOURCES;
    el.stale = 1;
    await expect.poll(() => text(el.querySelector(".ui-aism__stale-text"))).toBe("1 new source since this summary");
    el.stale = true;
    await expect.poll(() => text(el.querySelector(".ui-aism__stale-text"))).toBe("The sources have changed since this summary");
    el.staleLabel = "The channel has moved on";
    await expect.poll(() => text(el.querySelector(".ui-aism__stale-text"))).toBe("The channel has moved on");
    el.stale = false;
    await expect.poll(() => el.querySelector(".ui-aism__stale")).toBeNull();
  });

  test("feedback is a pair of toggles with a cancelable tc-feedback; pressing again takes it back", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-feedback", (e) => seen.push((e as CustomEvent<{ value: unknown }>).detail.value));
    const up = el.querySelector<HTMLButtonElement>('.ui-aism__thumb[data-value="up"]')!;
    const down = el.querySelector<HTMLButtonElement>('.ui-aism__thumb[data-value="down"]')!;
    expect(el.querySelector(".ui-aism__helpful")!.getAttribute("role")).toBe("group");
    up.click();
    await expect.poll(() => up.getAttribute("aria-pressed")).toBe("true");
    expect(el.feedback).toBe("up");
    expect(status(el)).toBe("Marked as helpful");
    down.click();
    await expect.poll(() => down.getAttribute("aria-pressed")).toBe("true");
    expect(up.getAttribute("aria-pressed")).toBe("false");
    down.click();
    await expect.poll(() => el.feedback).toBeNull();
    expect(seen).toEqual(["up", "down", null]);
    el.addEventListener("tc-feedback", (e) => e.preventDefault());
    up.click();
    await settle();
    expect(el.feedback).toBeNull();
  });

  test("Short / Detailed is a radio group with a cancelable tc-length-change", async () => {
    const el = await make();
    const radios = el.querySelectorAll<HTMLElement>('[role="radio"]');
    expect(el.querySelector('[role="radiogroup"]')!.getAttribute("aria-label")).toBe("Summary length");
    radios[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => el.length).toBe("detailed");
    await expect.poll(() => document.activeElement?.getAttribute("data-len")).toBe("detailed");
    el.addEventListener("tc-length-change", (e) => e.preventDefault());
    radios[0].click();
    await settle();
    expect(el.length).toBe("detailed");
  });

  test("Sources opens a numbered list with each kind and link; Copy puts everything on the clipboard; Regenerate fires tc-retry", async () => {
    const el = await make();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-aism__src-toggle")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(text(toggle)).toBe("Sources4");
    toggle.click();
    await expect.poll(() => el.querySelectorAll(".ui-aism__src").length).toBe(4);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-controls")).toBe(el.querySelector(".ui-aism__sources")!.id);
    expect([...el.querySelectorAll(".ui-aism__src")].map((s) => (s as HTMLElement).dataset.kind)).toEqual(["message", "message", "document", "ticket"]);
    expect(el.querySelector<HTMLAnchorElement>(".ui-aism__src-link")!.getAttribute("href")).toBe("/docs/checklist");
    expect(text(el.querySelector(".ui-aism__src-at"))).toBe("1 h ago");
    const writes: string[] = [];
    vi.spyOn(navigator.clipboard, "writeText").mockImplementation(async (t: string) => void writes.push(t));
    const copies: string[] = [];
    el.addEventListener("tc-copy", (e) => copies.push((e as CustomEvent<{ text: string }>).detail.text));
    el.querySelector<HTMLButtonElement>(".ui-aism__copy")!.click();
    await expect.poll(() => copies.length).toBe(1);
    expect(writes[0]).toContain("TL;DR: Launch is set for 12 November.");
    expect(writes[0]).toContain("• Launch on 12 November. [1][3]");
    expect(writes[0]).toContain("• Who signs off the fix?");
    expect(writes[0]).toContain("[3] Launch checklist – /docs/checklist");
    await expect.poll(() => text(el.querySelector(".ui-aism__copy"))).toBe("Copied");
    expect(status(el)).toBe("Summary copied");
    const retried: string[] = [];
    el.addEventListener("tc-retry", (e) => retried.push((e as CustomEvent<{ reason: string }>).detail.reason));
    el.querySelector<HTMLButtonElement>(".ui-aism__regen")!.click();
    expect(retried).toEqual(["regenerate"]);
  });

  test("without `now` the element keeps its own clock; focus left on a vanishing button moves to Short / Detailed", async () => {
    const el = await fixture<TcAiSummary>(html`<tc-ai-summary status="done" .generatedAt=${Date.now() - 5 * MIN} .sources=${SOURCES} summary="Gist."></tc-ai-summary>`);
    expect(text(el.querySelector(".ui-aism__ai-by"))).toBe("5 min ago");
    const idle = await make("standard", "idle");
    button(idle, "Summarise").focus();
    idle.status = "summarising";
    await expect.poll(() => document.activeElement?.closest(".ui-aism__len")).toBeTruthy();
  });

  test("React wrapper: length and feedback are controlled, events reach the callbacks, and returning false prevents a source link", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const lengths: string[] = [];
    const feedback: unknown[] = [];
    const cites: AiSummaryCiteOpen[] = [];
    await act(async () =>
      root.render(
        React.createElement(AiSummary, {
          title: "Thread summary",
          status: "done",
          sources: SOURCES,
          summary: SUMMARY,
          points: POINTS,
          length: "short",
          feedback: null,
          onLengthChange: (l) => void lengths.push(l),
          onFeedbackChange: (v) => void feedback.push(v),
          onCiteOpen: (c) => {
            cites.push(c);
            return false;
          },
        }),
      ),
    );
    await settle();
    const el = host.querySelector("tc-ai-summary")!;
    expect(text(el.querySelector(".tc-head__title"))).toBe("Thread summary");
    el.querySelectorAll<HTMLElement>('[role="radio"]')[1].click();
    el.querySelector<HTMLElement>('.ui-aism__thumb[data-value="up"]')!.click();
    await settle();
    expect(lengths).toEqual(["detailed"]);
    expect(feedback).toEqual(["up"]);
    expect(el.length).toBe("short");
    expect(el.feedback).toBeNull();
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    el.querySelector("a.ui-aism__cite")!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(cites).toEqual([{ sourceId: "d1", pointId: "date" }]);
    await act(async () => root.unmount());
  });

  test("React wrapper: uncontrolled length and feedback survive parent re-renders", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(AiSummary, { status: "done", summary: SUMMARY, sources: SOURCES, defaultLength: "detailed", "data-n": n } as React.ComponentProps<typeof AiSummary>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-ai-summary")!;
    expect(el.length).toBe("detailed");
    el.querySelectorAll<HTMLElement>('[role="radio"]')[0].click();
    el.querySelector<HTMLElement>('.ui-aism__thumb[data-value="down"]')!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.length).toBe("short");
    expect(el.feedback).toBe("down");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look – done with the sources open and stale, summarising, error and idle`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-ai-summary status="done" subject="#launch" model="Claude Sonnet" sources-open .now=${NOW} .generatedAt=${NOW - 12 * MIN} .stale=${3} .sources=${SOURCES} tldr="Launch is set." .summary=${SUMMARY} .points=${POINTS} .questions=${["Who signs off?"]} .feedback=${"up"}></tc-ai-summary>
        <tc-ai-summary look="clean" status="done" .now=${NOW} .sources=${SOURCES} .summary=${SUMMARY} .points=${POINTS}></tc-ai-summary>
        <tc-ai-summary status="summarising" .sources=${SOURCES}></tc-ai-summary>
        <tc-ai-summary look="clean" status="error" error="The model timed out." .sources=${SOURCES}></tc-ai-summary>
        <tc-ai-summary status="idle" .sources=${SOURCES}></tc-ai-summary>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
