/*
 * <tc-ai-disclosure> in real browsers: the mark's kinds and words, the card it opens (what made it, the review, the
 * limits, Report a problem), Escape and focus, the notice with its links and Dismiss, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/ai-disclosure";
import type { AiDisclosureReport, TcAiDisclosure } from "../../src/elements/ai-disclosure";
import { AiDisclosure } from "../../src/elements/react/ai-disclosure";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const MADE = new Date(2026, 10, 12, 9, 15).getTime();
const LIMITS = ["Can miss handwritten notes on scans.", "Doesn't know about calls that weren't logged."];

const mark = (extra: Partial<TcAiDisclosure> = {}) =>
  fixture<TcAiDisclosure>(
    html`<tc-ai-disclosure model="Review assistant" .madeAt=${MADE} .limits=${LIMITS} .reportable=${extra.reportable ?? true} reviewed-by=${extra.reviewedBy ?? ""} locale="en-GB"></tc-ai-disclosure>`,
  );
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
const markBtn = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-aid__mark")!;
const card = (el: Element) => el.querySelector<HTMLElement>(".ui-aid__card");

describe("tc-ai-disclosure", () => {
  test("the mark: a button named by its words, in both looks; kind and label set the words", async () => {
    const el = await mark();
    expect(el.dataset.ui).toBe("aid");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("variant")).toBe("mark");
    const b = markBtn(el);
    expect(b.textContent!.trim()).toBe("AI-generated");
    expect(b.getAttribute("aria-expanded")).toBe("false");
    expect(b.getAttribute("aria-haspopup")).toBe("dialog");
    el.kind = "assisted";
    await settle();
    expect(markBtn(el).textContent!.trim()).toBe("AI-assisted");
    el.kind = "edited";
    await settle();
    expect(markBtn(el).textContent!.trim()).toBe("Edited by you");
    el.label = "Drafted by AI";
    await settle();
    expect(markBtn(el).textContent!.trim()).toBe("Drafted by AI");
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
  });

  test("pressing the mark opens a dialog card: what made it, the review, the limits; Escape closes it and focus returns", async () => {
    const el = await mark();
    const seen = listen<{ open: boolean }>(el, "tc-open-change");
    markBtn(el).click();
    await settle();
    const c = card(el)!;
    expect(c).not.toBeNull();
    expect(seen).toEqual([{ open: true }]);
    expect(markBtn(el).getAttribute("aria-expanded")).toBe("true");
    expect(markBtn(el).getAttribute("aria-controls")).toBe(c.id);
    expect(c.getAttribute("role")).toBe("dialog");
    expect(document.getElementById(c.getAttribute("aria-labelledby")!)!.textContent).toBe("AI-generated");
    expect(c.querySelector(".ui-aid__means")!.textContent).toBe("An AI wrote this. Check it before you rely on it.");
    expect(c.querySelector(".ui-aid__made")!.textContent).toBe("Made by Review assistant · 12 Nov 2026");
    expect(c.querySelector(".ui-aid__review")!.textContent!.trim()).toBe("Not reviewed by a person yet");
    expect([...c.querySelectorAll(".ui-aid__limits li")].map((l) => l.textContent)).toEqual(LIMITS);
    await expect.poll(() => c.contains(document.activeElement)).toBe(true);
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true }));
    await settle();
    expect(card(el)).toBeNull();
    expect(seen.at(-1)).toEqual({ open: false });
    await expect.poll(() => document.activeElement).toBe(markBtn(el));
    // show() and hide()
    el.show();
    await settle();
    expect(el.open).toBe(true);
    el.hide();
    await settle();
    expect(el.open).toBe(false);
  });

  test("reviewed: says who; no model, no made-by line", async () => {
    const el = await fixture<TcAiDisclosure>(html`<tc-ai-disclosure kind="assisted" reviewed-by="Priya Shah"></tc-ai-disclosure>`);
    markBtn(el).click();
    await settle();
    const c = card(el)!;
    expect(c.querySelector(".ui-aid__review")!.getAttribute("data-reviewed")).toBe("true");
    expect(c.querySelector(".ui-aid__review")!.textContent!.trim()).toBe("Reviewed by Priya Shah");
    expect(c.querySelector(".ui-aid__made")).toBeNull();
    expect(c.querySelector(".ui-aid__limits")).toBeNull();
    expect(c.querySelector(".ui-aid__report")).toBeNull();
  });

  test("Report a problem: a cancelable tc-report, then Reported with a status message; a link with report-href", async () => {
    const el = await mark();
    const seen = listen<AiDisclosureReport>(el, "tc-report");
    markBtn(el).click();
    await settle();
    card(el)!.querySelector<HTMLButtonElement>("button.ui-aid__report")!.click();
    await settle();
    expect(seen).toEqual([{ kind: "generated", model: "Review assistant" }]);
    expect(el.reported).toBe(true);
    expect(card(el)!.querySelector(".ui-aid__reported")!.textContent!.trim()).toBe("Reported – thank you");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Reported – thank you");

    const kept = await mark();
    listen(kept, "tc-report", true);
    markBtn(kept).click();
    await settle();
    card(kept)!.querySelector<HTMLButtonElement>("button.ui-aid__report")!.click();
    await settle();
    expect(kept.reported).toBe(false);

    const linked = await fixture<TcAiDisclosure>(html`<tc-ai-disclosure report-href="/report"></tc-ai-disclosure>`);
    markBtn(linked).click();
    await settle();
    expect(card(linked)!.querySelector<HTMLAnchorElement>("a.ui-aid__report")!.getAttribute("href")).toBe("/report");
  });

  test("the notice: a note named by its title, the body, links, limits; Dismiss hides it unless prevented", async () => {
    const el = await fixture<TcAiDisclosure>(html`<tc-ai-disclosure variant="notice" contact-href="/help" learn-href="/how" dismissible .limits=${LIMITS}></tc-ai-disclosure>`);
    expect(el.getAttribute("role")).toBe("note");
    expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("You're working with an AI assistant");
    expect(el.querySelector(".ui-aid__notice-body")!.textContent).toContain("It can be wrong");
    expect([...el.querySelectorAll<HTMLAnchorElement>(".ui-aid__link")].map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      ["Talk to a person", "/help"],
      ["How the assistant works", "/how"],
    ]);
    expect(el.querySelectorAll(".ui-aid__notice-limits li")).toHaveLength(2);
    el.heading = "About the review assistant";
    el.body = "It reads case files for you.";
    el.contactLabel = "Ask the review lead";
    await settle();
    expect(el.querySelector(".ui-aid__notice-title")!.textContent).toBe("About the review assistant");
    expect(el.querySelector(".ui-aid__notice-body")!.textContent).toBe("It reads case files for you.");
    expect(el.querySelector(".ui-aid__link")!.textContent).toBe("Ask the review lead");
    const prevented = listen(el, "tc-dismiss", true);
    el.querySelector<HTMLButtonElement>(".ui-aid__close")!.click();
    await settle();
    expect(prevented).toHaveLength(1);
    expect(el.hidden).toBe(false);

    const free = await fixture<TcAiDisclosure>(html`<tc-ai-disclosure variant="notice" dismissible></tc-ai-disclosure>`);
    free.querySelector<HTMLButtonElement>(".ui-aid__close")!.click();
    await settle();
    expect(free.dismissed).toBe(true);
    expect(free.hidden).toBe(true);
    expect(free.getBoundingClientRect().height).toBe(0);
    // Back to a mark: no note role
    free.variant = "mark";
    await settle();
    expect(free.getAttribute("role")).toBeNull();
    expect(free.hidden).toBe(false);
  });

  test("React wrapper: onReport and onDismiss; the notice's close shows with onDismiss", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onReport = vi.fn();
    const onDismiss = vi.fn(() => false);
    const onOpenChange = vi.fn();
    await act(async () =>
      root.render(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(AiDisclosure, { model: "Review assistant", reportable: true, onReport, onOpenChange, className: "consumer" }),
          React.createElement(AiDisclosure, { variant: "notice", title: "About the assistant", onDismiss }),
        ),
      ),
    );
    await settle();
    const [m, n] = [...host.querySelectorAll<TcAiDisclosure>("tc-ai-disclosure")];
    expect(m.classList.contains("consumer")).toBe(true);
    await act(async () => markBtn(m).click());
    await settle();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    await act(async () => card(m)!.querySelector<HTMLButtonElement>("button.ui-aid__report")!.click());
    expect(onReport).toHaveBeenCalledWith({ kind: "generated", model: "Review assistant" });
    expect(n.querySelector(".ui-aid__notice-title")!.textContent).toBe("About the assistant");
    await act(async () => n.querySelector<HTMLButtonElement>(".ui-aid__close")!.click());
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(n.dismissed).toBe(false);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}; color: ${theme === "dark" ? "#fff" : "#111"}">
            <tc-ai-disclosure look=${look} variant="notice" contact-href="#c" learn-href="#l" dismissible reportable></tc-ai-disclosure>
            <p>Case summary <tc-ai-disclosure look=${look} model="Review assistant" .madeAt=${MADE} .limits=${LIMITS} reportable></tc-ai-disclosure></p>
            <p>Note <tc-ai-disclosure look=${look} kind="assisted" reviewed-by="Priya Shah"></tc-ai-disclosure></p>
            <p>Letter <tc-ai-disclosure look=${look} kind="edited"></tc-ai-disclosure></p>
          </div>`,
        );
        const m = wrap.querySelectorAll<TcAiDisclosure>("tc-ai-disclosure")[1];
        markBtn(m).click();
        await settle();
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
