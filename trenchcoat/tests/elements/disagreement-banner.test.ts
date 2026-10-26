/*
 * <tc-disagreement-banner> in real browsers: the word diff on both sides, the count, long answers shortened to the
 * changes and the toggle (controlled and not), pointing at a change, dismiss and open-the-earlier-session, the
 * wrapper, axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/disagreement-banner";
import type { DisagreementAnswer, DisagreementExpandedChange, DisagreementOpenSession, TcDisagreementBanner } from "../../src/elements/disagreement-banner";
import { DisagreementBanner } from "../../src/elements/react/disagreement-banner";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const EARLIER: DisagreementAnswer = { text: "Either side can end the agreement with 30 days notice.", when: "Oct 12", sessionId: "s-41" };
const TODAY: DisagreementAnswer = { text: "Either side can end the agreement with 60 days notice.", when: "Today, 10:42" };
const LONG_A =
  "The agreement runs for twelve months from the start date and renews on its own unless someone objects. Either side can end it with 30 days notice in writing, sent to the address on the first page of the contract, and no fee applies after the first year has passed.";
const LONG_B =
  "The agreement runs for twelve months from the start date and renews on its own unless someone objects. Either side can end it with 60 days notice in writing, sent to the address on the first page of the contract, and no fee applies after the first year has passed.";
const text = (n: Element | null) => n!.textContent!.replace(/\s+/g, " ").trim();
const cell = (el: Element, side: string) => el.querySelector(`.ui-dsb__cell[data-side="${side}"]`)!;

describe("tc-disagreement-banner", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host is a group named by the heading; both answers, the difference marked on each side`, async () => {
      const el = await fixture<TcDisagreementBanner>(html`<tc-disagreement-banner look=${look} question="Can we end the contract early?" .earlier=${EARLIER} .current=${TODAY}></tc-disagreement-banner>`);
      expect(el.dataset.ui).toBe("dsb");
      expect(el.dataset.look).toBe(look);
      expect(getComputedStyle(el).display).toBe("block");
      expect(el.getAttribute("role")).toBe("group");
      expect(el.getAttribute("aria-labelledby")).toBe(el.querySelector(".ui-dsb__title")!.id);
      expect(text(el.querySelector(".ui-dsb__title"))).toBe("This answer differs from an earlier one");
      expect(text(el.querySelector(".ui-dsb__question"))).toBe("Question: “Can we end the contract early?”");
      expect(text(el.querySelector(".ui-dsb__count"))).toBe("1 difference");
      expect([text(cell(el, "earlier").querySelector(".ui-dsb__name")), text(cell(el, "earlier").querySelector(".ui-dsb__when"))]).toEqual(["Earlier", "Oct 12"]);
      expect([text(cell(el, "current").querySelector(".ui-dsb__name")), text(cell(el, "current").querySelector(".ui-dsb__when"))]).toEqual(["Today", "Today, 10:42"]);
      expect([...cell(el, "earlier").querySelectorAll("del")].map((d) => d.textContent)).toEqual(["30"]);
      expect(cell(el, "earlier").querySelector("ins")).toBeNull();
      expect([...cell(el, "current").querySelectorAll("ins")].map((d) => d.textContent)).toEqual(["60"]);
      expect(text(cell(el, "current").querySelector(".ui-dsb__text"))).toBe(TODAY.text);
      // Short answers: nothing to shorten, so no toggle; no actions asked for, so no foot
      expect(el.querySelector(".ui-dsb__foot")).toBeNull();
      expect(el.querySelector(".ui-dsb__icon")).toBeNull();
    });
  }

  test("labels, the summary, and identical answers", async () => {
    const el = await fixture<TcDisagreementBanner>(html`<tc-disagreement-banner summary="The notice period doubled." .earlier=${{ ...EARLIER, label: "Session 41" }} .current=${{ text: EARLIER.text, label: "Now" }}></tc-disagreement-banner>`);
    expect(text(cell(el, "earlier").querySelector(".ui-dsb__name"))).toBe("Session 41");
    expect(text(cell(el, "current").querySelector(".ui-dsb__name"))).toBe("Now");
    expect(text(el.querySelector(".ui-dsb__count"))).toBe("Same answer");
    expect(text(el.querySelector(".ui-dsb__summary"))).toBe("The notice period doubled.");
    expect(el.querySelector("del, ins")).toBeNull();
  });

  test("long answers show only the changes with context; the toggle opens both in full", async () => {
    const el = await fixture<TcDisagreementBanner>(html`<tc-disagreement-banner context="4" .earlier=${{ text: LONG_A }} .current=${{ text: LONG_B }}></tc-disagreement-banner>`);
    const changes: boolean[] = [];
    el.addEventListener("tc-expanded-change", (e) => changes.push((e as CustomEvent<DisagreementExpandedChange>).detail.expanded));
    const right = () => text(cell(el, "current").querySelector(".ui-dsb__text"));
    // Four shared words either side of the change, the rest left out
    expect(right()).toBe("…(shared words left out) can end it with 60 days notice in writing, …(shared words left out)");
    const toggle = el.querySelector<HTMLButtonElement>(".ui-dsb__btn--ghost")!;
    expect(text(toggle)).toBe("Show full answers");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-controls")).toBe(el.querySelector(".ui-dsb__pair")!.id);
    toggle.click();
    await settle();
    expect(changes).toEqual([true]);
    expect(el.expanded).toBe(true);
    expect(right()).toBe(LONG_B);
    expect(text(toggle)).toBe("Show changes only");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    // Controlled: preventDefault keeps it until the app passes it back
    el.addEventListener("tc-expanded-change", (e) => e.preventDefault());
    toggle.click();
    await settle();
    expect(changes).toEqual([true, false]);
    expect(el.expanded).toBe(true);
    el.expanded = false;
    await settle();
    expect(right()).toContain("(shared words left out)");
  });

  test("pointing at a change lights up its counterpart; a missing word leaves a mark", async () => {
    const el = await fixture<TcDisagreementBanner>(html`<tc-disagreement-banner .earlier=${{ text: "We ship today." }} .current=${{ text: "We ship today and tomorrow." }}></tc-disagreement-banner>`);
    const ins = el.querySelector<HTMLElement>("ins.ui-dsb__ins")!;
    ins.dispatchEvent(new MouseEvent("mouseenter"));
    await settle();
    expect(el.querySelector("ins.ui-dsb__ins")!.hasAttribute("data-hot")).toBe(true);
    expect(el.querySelector('.ui-dsb__hole[data-chg="0"]')!.hasAttribute("data-hot")).toBe(true);
    el.querySelector(".ui-dsb__pair")!.dispatchEvent(new MouseEvent("mouseleave"));
    await settle();
    expect(el.querySelector("[data-hot]")).toBeNull();
  });

  test("Open earlier session: with can-open; fires tc-open-session with the session id and the answer", async () => {
    const el = await fixture<TcDisagreementBanner>(html`<tc-disagreement-banner can-open .earlier=${EARLIER} .current=${TODAY}></tc-disagreement-banner>`);
    const opened: DisagreementOpenSession[] = [];
    el.addEventListener("tc-open-session", (e) => opened.push((e as CustomEvent<DisagreementOpenSession>).detail));
    const btn = el.querySelector<HTMLButtonElement>(".ui-dsb__btn--secondary")!;
    expect(text(btn)).toBe("Open earlier session");
    btn.click();
    expect(opened).toEqual([{ sessionId: "s-41", answer: EARLIER }]);
  });

  test("Dismiss: with dismissible; cancelable; dismissed, nothing shows and focus stays on the banner", async () => {
    const el = await fixture<TcDisagreementBanner>(html`<tc-disagreement-banner dismissible .earlier=${EARLIER} .current=${TODAY}></tc-disagreement-banner>`);
    let n = 0;
    el.addEventListener("tc-dismiss", () => n++);
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-dismiss", stop);
    const x = el.querySelector<HTMLButtonElement>(".ui-dsb__icon")!;
    expect(x.getAttribute("aria-label")).toBe("Dismiss");
    x.click();
    await settle();
    expect(el.dismissed).toBe(false);
    el.removeEventListener("tc-dismiss", stop);
    x.focus();
    x.click();
    await settle();
    expect(n).toBe(2);
    expect(el.dismissed).toBe(true);
    expect(el.hasAttribute("dismissed")).toBe(true);
    expect(el.querySelector(".ui-dsb__card")).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Dismissed");
    expect(document.activeElement).toBe(el);
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getBoundingClientRect().height).toBeLessThan(2);
    el.dismissed = false;
    await settle();
    expect(el.getAttribute("role")).toBe("group");
    expect(el.querySelector(".ui-dsb__card")).toBeTruthy();
  });

  test("styles: reduced motion turns motion off; no endless loop; no theme-scoped colours", async () => {
    await fixture(html`<tc-disagreement-banner></tc-disagreement-banner>`);
    const css = (customElements.get("tc-disagreement-banner") as unknown as { css: string }).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    expect(css).not.toMatch(/infinite/);
    expect(css).not.toMatch(/\.dark\b|data-tc-theme="dark"/);
  });

  test("React wrapper: title; an uncontrolled toggle survives a parent re-render; onDismiss and onOpenEarlier", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const opened: (string | undefined)[] = [];
    const toggles: boolean[] = [];
    let dismissals = 0;
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(DisagreementBanner, {
        title: "Changed since last week",
        earlier: { text: LONG_A, sessionId: "s-9" },
        current: { text: LONG_B },
        onExpandedChange: (v) => toggles.push(v),
        onDismiss: () => {
          dismissals++;
          return false;
        },
        onOpenEarlier: (id) => opened.push(id),
        "data-n": n,
      } as React.ComponentProps<typeof DisagreementBanner>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-disagreement-banner")!;
    expect(el.heading).toBe("Changed since last week");
    el.querySelector<HTMLButtonElement>(".ui-dsb__btn--ghost")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(toggles).toEqual([true]);
    expect(el.expanded).toBe(true);
    el.querySelector<HTMLButtonElement>(".ui-dsb__btn--secondary")!.click();
    expect(opened).toEqual(["s-9"]);
    el.querySelector<HTMLButtonElement>(".ui-dsb__icon")!.click();
    await settle();
    expect(dismissals).toBe(1);
    expect(el.dismissed).toBe(false);
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme, shortened and in full", async () => {
    for (const theme of ["light", "dark"]) {
      for (const expanded of [false, true]) {
        const wrap = await fixture(html`<div data-tc-theme=${theme}>
          <div style="width: 760px"><tc-disagreement-banner dismissible can-open ?expanded=${expanded} question="Can we end it early?" summary="The notice period doubled." .earlier=${{ ...EARLIER, text: LONG_A }} .current=${{ ...TODAY, text: LONG_B }}></tc-disagreement-banner></div>
          <div style="width: 320px"><tc-disagreement-banner look="clean" dismissible can-open ?expanded=${expanded} .earlier=${{ ...EARLIER, text: LONG_A }} .current=${{ ...TODAY, text: LONG_B }}></tc-disagreement-banner></div>
          <div style="width: 760px"><tc-disagreement-banner look="clean" .earlier=${{ text: "We ship today." }} .current=${{ text: "We ship today and tomorrow." }}></tc-disagreement-banner></div>
        </div>`);
        wrap.getAnimations({ subtree: true }).forEach((a) => a.finish());
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${theme}/${expanded} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
        cleanup();
      }
    }
  });
});
