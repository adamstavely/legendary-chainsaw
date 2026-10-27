/*
 * <tc-notification-stack> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/notification-stack";
import type { Notice, TcNotificationStack } from "../../src/elements/notification-stack";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const a: Notice = { id: "a b", title: "First", text: "One" };
const b: Notice = { id: "b", title: "Second", text: "Two" };
const c: Notice = { id: "c", title: "Third", text: "Three" };

const titles = (el: Element) => [...el.querySelectorAll("article:not([data-leaving]) h3")].map((h) => h.textContent);
const close = (el: Element, title: string) => el.querySelector<HTMLButtonElement>(`button[aria-label="Dismiss ${title}"]`)!;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("tc-notification-stack", () => {
  test("the host is the root and the region, named Notifications", async () => {
    const el = await fixture<TcNotificationStack>(html`<tc-notification-stack .notices=${[a]}></tc-notification-stack>`);
    expect(el.dataset.ui).toBe("ns");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Notifications");
    const named = await fixture<TcNotificationStack>(html`<tc-notification-stack aria-label="Updates" .notices=${[a]}></tc-notification-stack>`);
    expect(named.getAttribute("aria-label")).toBe("Updates");
  });

  test("the stack follows notices (contract: controlled notices)", async () => {
    const el = await fixture<TcNotificationStack>(html`<tc-notification-stack .notices=${[a]}></tc-notification-stack>`);
    expect(titles(el)).toEqual(["First"]);
    el.notices = [b, a];
    await settle();
    expect(titles(el)).toEqual(["Second", "First"]);
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("notices added after mount show up; dismissed ones stay hidden while listed", async () => {
        const el = await fixture<TcNotificationStack>(html`<tc-notification-stack look=${look} .notices=${[a, b]}></tc-notification-stack>`);
        close(el, "First").click();
        // Slid out and gone
        await expect.poll(() => el.querySelectorAll("article").length, { timeout: 3000 }).toBe(1);
        await settle();
        expect(titles(el)).toEqual(["Second"]);
        el.notices = [c, a, b];
        await settle();
        expect(titles(el)).toEqual(["Third", "Second"]);
      });

      test("an app that drops the notice on dismiss still sees it slide out, and it can come back", async () => {
        const el = await fixture<TcNotificationStack>(html`<tc-notification-stack look=${look} .notices=${[a, b]}></tc-notification-stack>`);
        el.addEventListener("tc-dismiss", () => (el.notices = [b]));
        close(el, "First").click();
        await settle();
        expect(el.querySelectorAll("article[data-leaving]")).toHaveLength(1);
        await expect.poll(() => el.querySelectorAll("article").length, { timeout: 3000 }).toBe(1);
        await settle();
        el.notices = [a, b];
        await settle();
        expect(titles(el)).toEqual(["First", "Second"]);
      });

      test("cards are named without ids built from notice ids; the front card says where it is", async () => {
        const el = await fixture<TcNotificationStack>(html`<tc-notification-stack look=${look} .notices=${[a, b, c]}></tc-notification-stack>`);
        expect(el.querySelector("[id]")).toBeNull();
        const cards = [...el.querySelectorAll("article")];
        expect(cards[0].getAttribute("aria-label")).toBe("First, 1 of 3");
        // Cards behind are hidden and inert, and peek out below the front one
        expect(cards[1].getAttribute("aria-hidden")).toBe("true");
        expect(cards[1].inert).toBe(true);
        expect(cards[1].style.transform).toMatch(/translateY\(12px\) scale\(0\.95\)/);
        expect(parseFloat(el.style.height)).toBe(cards[0].offsetHeight + 24);
      });

      test("dismissing the focused front card moves focus to the next card's dismiss button (2.4.3)", async () => {
        const el = await fixture<TcNotificationStack>(html`<tc-notification-stack look=${look} .notices=${[a, b, c]}></tc-notification-stack>`);
        const x = close(el, "First");
        x.focus();
        x.click();
        await settle();
        expect(document.activeElement).toBe(close(el, "Second"));
      });

      test("the last dismissal leaves focus on the stack; dismissals are announced in one persistent status (2.4.3, 4.1.3)", async () => {
        const el = await fixture<TcNotificationStack>(html`<tc-notification-stack look=${look} .notices=${[a]}></tc-notification-stack>`);
        const status = el.querySelector('[role="status"]')!;
        expect(status.textContent).toBe("");
        const x = close(el, "First");
        x.focus();
        x.click();
        await settle();
        await settle();
        expect(document.activeElement).toBe(el);
        expect(el.querySelector('[role="status"]')).toBe(status);
        expect(status.textContent).toBe("Dismissed First. No more notices.");
      });
    });
  }

  test("tc-dismiss carries the notice; removing the stack mid-exit clears its timer", async () => {
    const el = await fixture<TcNotificationStack>(html`<tc-notification-stack .notices=${[a, b]}></tc-notification-stack>`);
    const got: Notice[] = [];
    el.addEventListener("tc-dismiss", (e) => got.push((e as CustomEvent<Notice>).detail));
    close(el, "First").click();
    expect(got).toEqual([a]);
    el.remove();
    await wait(400);
    expect(el.leaving).toEqual([]);
  });

  test("a notice's action is a link or a button", async () => {
    let clicked = 0;
    const el = await fixture<TcNotificationStack>(html`<tc-notification-stack
      .notices=${[{ ...a, action: { label: "Status", href: "#status", external: true } }, { ...b, action: { label: "Try", onClick: () => clicked++ } }]}
    ></tc-notification-stack>`);
    const link = el.querySelector<HTMLAnchorElement>("a.ui-ns__btn")!;
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noreferrer");
    expect(link.querySelector("svg")).toBeTruthy();
    close(el, "First").click();
    await settle();
    el.querySelector<HTMLButtonElement>('article[data-depth="0"] button.ui-ns__btn')!.click();
    expect(clicked).toBe(1);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-notification-stack .notices=${[a, b, c]}></tc-notification-stack>
      <tc-notification-stack look="clean" aria-label="Clean notifications" .notices=${[{ ...a, badge: "New", action: { label: "Open", href: "#x" } }, b]}></tc-notification-stack>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
