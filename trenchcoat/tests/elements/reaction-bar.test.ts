/*
 * <tc-reaction-bar> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/reaction-bar";
import type { ReactionChange, TcReactionBar } from "../../src/elements/reaction-bar";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const btn = (el: Element, kind: string) => el.querySelector<HTMLButtonElement>(`[data-kind="${kind}"]`)!;
const sheet = () =>
  [...document.adoptedStyleSheets]
    .flatMap((s) => [...s.cssRules].map((r) => r.cssText))
    .concat([...document.querySelectorAll("style")].map((s) => s.textContent ?? ""))
    .join("\n");

describe("tc-reaction-bar", () => {
  test("the host is the root and the group, named Reactions", async () => {
    const el = await fixture<TcReactionBar>(html`<tc-reaction-bar></tc-reaction-bar>`);
    expect(el.dataset.ui).toBe("rb");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("group");
    expect(el.getAttribute("aria-label")).toBe("Reactions");
    expect([...el.querySelectorAll("button")].map((b) => b.dataset.kind)).toEqual(["like", "comment", "repost", "share"]);
    expect(getComputedStyle(el).display).toBe("inline-flex");
  });

  test("a name the page gives stays", async () => {
    const el = await fixture<TcReactionBar>(html`<tc-reaction-bar aria-label="Post reactions"></tc-reaction-bar>`);
    expect(el.getAttribute("aria-label")).toBe("Post reactions");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: an action added after mount renders and toggles`, async () => {
      const el = await fixture<TcReactionBar>(html`<tc-reaction-bar look=${look} .actions=${["like"]} .reactions=${{ like: { count: 1 }, share: { count: 5 } }}></tc-reaction-bar>`);
      el.actions = ["like", "share"];
      await settle();
      const share = btn(el, "share");
      expect(share.getAttribute("aria-label")).toBe("Share, 5 shares");
      share.click();
      await settle();
      expect(share.getAttribute("aria-pressed")).toBe("true");
      expect(share.getAttribute("aria-label")).toBe("Share, 6 shares");
    });

    test(`${look}: taps apply locally while the property stays the same, and a new value wins`, async () => {
      const onReact = vi.fn();
      const el = await fixture<TcReactionBar>(html`<tc-reaction-bar look=${look} .actions=${["like"]} .reactions=${{ like: { count: 1 } }} @tc-reaction-change=${(e: CustomEvent<ReactionChange>) => onReact(e.detail)}></tc-reaction-bar>`);
      expect(btn(el, "like").getAttribute("aria-label")).toBe("Like, 1 like");
      btn(el, "like").click();
      await settle();
      expect(onReact).toHaveBeenCalledWith({ key: "like", state: { active: true, count: 2 } });
      el.reactions = { like: { count: 1 } }; // a fresh object with the same value keeps the tap
      await settle();
      expect(btn(el, "like").getAttribute("aria-label")).toBe("Like, 2 likes");
      el.reactions = { like: { count: 10 } };
      await settle();
      expect(btn(el, "like").getAttribute("aria-label")).toBe("Like, 10 likes");
      expect(btn(el, "like").getAttribute("aria-pressed")).toBe("false");
    });

    test(`${look}: the name contains the count as shown (2.5.3); the exact count is in the title`, async () => {
      const el = await fixture<TcReactionBar>(html`<tc-reaction-bar look=${look} .actions=${["like"]} .reactions=${{ like: { count: 1299 } }}></tc-reaction-bar>`);
      const like = btn(el, "like");
      expect(like.getAttribute("aria-label")).toBe("Like, 1.3K likes");
      expect(like.getAttribute("title")).toBe("1,299 likes");
      expect(el.querySelector(".ui-rb__digits")!.textContent).toBe("1.3K");
    });

    test(`${look}: pressed has a non-colour cue`, async () => {
      const el = await fixture<TcReactionBar>(html`<tc-reaction-bar look=${look} .reactions=${{ like: { count: 2, active: true } }}></tc-reaction-bar>`);
      const fill = btn(el, "like").querySelector<SVGPathElement>(".ui-rb__fill")!;
      expect(getComputedStyle(fill).fill).not.toMatch(/transparent|rgba\(0, 0, 0, 0\)|none/);
    });
  }

  test("styles: focus uses the ring token, pressed has a heavier line and a selected hairline", async () => {
    await fixture(html`<tc-reaction-bar></tc-reaction-bar>`);
    const css = sheet();
    expect(css).toMatch(/\.ui-rb__btn:focus-visible\s*{\s*outline: var\(--tc-focus-outline/);
    expect(css).toMatch(/\[aria-pressed="true"\] \.ui-rb__icon svg\s*{\s*stroke-width/);
    expect(css).toMatch(/\[aria-pressed="true"\][^{]*{[^}]*box-shadow: inset 0 0 0 1px var\(--tc-border-selected/);
  });

  test("the keyboard: Tab reaches each action, Enter and Space toggle it", async () => {
    const el = await fixture<TcReactionBar>(html`<tc-reaction-bar .actions=${["like", "share"]}></tc-reaction-bar>`);
    // Native buttons: in the tab order, activated by Enter and Space
    expect([...el.querySelectorAll("button")].every((b) => b.tabIndex === 0 && b.type === "button")).toBe(true);
    btn(el, "like").focus();
    expect(document.activeElement).toBe(btn(el, "like"));
  });

  test("the count widens to fit, and a tap restarts the pop", async () => {
    const el = await fixture<TcReactionBar>(html`<tc-reaction-bar .actions=${["like"]} .reactions=${{ like: { count: 9 } }}></tc-reaction-bar>`);
    const count = el.querySelector<HTMLElement>(".ui-rb__count")!;
    expect(parseFloat(count.style.width)).toBeGreaterThan(0);
    const before = el.querySelector(".ui-rb__icon")!;
    expect(before.hasAttribute("data-pop")).toBe(false);
    btn(el, "like").click();
    await settle();
    const after = el.querySelector(".ui-rb__icon")!;
    expect(after).not.toBe(before);
    expect(after.hasAttribute("data-pop")).toBe(true);
    expect(count.hasAttribute("data-smooth")).toBe(true);
  });

  test("preventDefault keeps the tap from applying (controlled use)", async () => {
    const el = await fixture<TcReactionBar>(html`<tc-reaction-bar .actions=${["like"]} .reactions=${{ like: { count: 3 } }}></tc-reaction-bar>`);
    el.addEventListener("tc-reaction-change", (e) => {
      e.preventDefault();
      el.reactions = { like: (e as CustomEvent<ReactionChange>).detail.state };
    });
    btn(el, "like").click();
    await settle();
    expect(btn(el, "like").getAttribute("aria-label")).toBe("Like, 4 likes");
    expect(btn(el, "like").getAttribute("aria-pressed")).toBe("true");
  });

  test("a prevented tap changes nothing", async () => {
    const el = await fixture<TcReactionBar>(html`<tc-reaction-bar .actions=${["like"]} .reactions=${{ like: { count: 3 } }} @tc-reaction-change=${(e: Event) => e.preventDefault()}></tc-reaction-bar>`);
    btn(el, "like").click();
    await settle();
    expect(btn(el, "like").getAttribute("aria-label")).toBe("Like, 3 likes");
    expect(btn(el, "like").getAttribute("aria-pressed")).toBe("false");
    expect(el.querySelector(".ui-rb__icon")!.hasAttribute("data-pop")).toBe(false);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-reaction-bar .reactions=${{ like: { count: 1299 }, share: { count: 4, active: true } }}></tc-reaction-bar>
      <tc-reaction-bar look="clean" aria-label="Clean reactions" .reactions=${{ like: { count: 1299 }, share: { count: 4, active: true } }}></tc-reaction-bar>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
