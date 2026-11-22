/*
 * <tc-help-guide> in real browsers: the link and its name, new tab or same tab, size, label and tooltip, opening (and
 * handing the guide to the page), read, the Updated dot, cancelable events, the React wrapper and axe in both looks
 * and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/help-guide";
import type { HelpGuideOpen, TcHelpGuide } from "../../src/elements/help-guide";
import { HelpGuide } from "../../src/elements/react/help-guide";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const HREF = "https://help.example.com/guides/risk-rules";
const NOW = Date.UTC(2026, 10, 20, 12);
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const link = (el: Element) => el.querySelector<HTMLAnchorElement>(".ui-hgd__trigger")!;
/** Clicks the link without leaving the test page: the element's own handler runs, then the navigation is stopped */
const click = (el: Element, init: MouseEventInit = {}) => {
  const a = link(el);
  const stop = (e: Event) => e.preventDefault();
  window.addEventListener("click", stop, { once: true });
  const ev = new MouseEvent("click", { bubbles: true, cancelable: true, composed: true, button: 0, ...init });
  a.dispatchEvent(ev);
  return ev;
};
const guide = (extra = html``) =>
  fixture<TcHelpGuide>(html`<tc-help-guide heading="Write a risk rule" href=${HREF} minutes="5" .now=${NOW}>${extra}</tc-help-guide>`);

describe("tc-help-guide", () => {
  for (const look of ["standard", "clean"]) {
    test(`renders in ${look}: one link with the guide page, named after the guide`, async () => {
      const wrap = await fixture<HTMLElement>(html`<div><tc-help-guide look=${look} heading="Write a risk rule" href=${HREF} minutes="5"></tc-help-guide></div>`);
      const el = wrap.querySelector<TcHelpGuide>("tc-help-guide")!;
      expect(el.dataset.ui).toBe("hgd");
      expect(el.dataset.look).toBe(look);
      const a = link(el);
      expect(a.tagName).toBe("A");
      expect(a.getAttribute("href")).toBe(HREF);
      expect(a.target).toBe("_blank");
      expect(a.rel).toBe("noopener");
      expect(text(a.querySelector(".tc-sr-only"))).toBe("Read guide: Write a risk rule, 5 min read, opens in a new tab");
      expect(text(a.querySelector(".ui-hgd__tip"))).toBe("Write a risk rule · 5 min read");
      expect(a.querySelector(".ui-hgd__icon mask")).not.toBeNull();
      expect(a.querySelector(".ui-hgd__seen")).toBeNull();
      expect(a.querySelector(".ui-hgd__new")).toBeNull();
    });
  }

  test("same-tab drops the new tab; sizes follow the text; a label replaces the tooltip; read adds a check", async () => {
    const el = await fixture<HTMLElement>(html`<div style="font-size: 20px">
      <tc-help-guide heading="A" href=${HREF} size="sm" same-tab></tc-help-guide><tc-help-guide heading="B" href=${HREF}></tc-help-guide><tc-help-guide heading="C" href=${HREF} size="lg"></tc-help-guide>
      <tc-help-guide heading="Reassign cases in bulk" href=${HREF} label="Read the guide" read></tc-help-guide>
    </div>`);
    const [sm, md, lg, labelled] = [...el.querySelectorAll<TcHelpGuide>("tc-help-guide")];
    expect(link(sm!).hasAttribute("target")).toBe(false);
    expect(text(link(sm!).querySelector(".tc-sr-only"))).toBe("Read guide: A");
    const size = (x: Element) => x.querySelector(".ui-hgd__mark")!.getBoundingClientRect().width;
    expect(size(sm!)).toBeCloseTo(20, 0);
    expect(size(md!)).toBeCloseTo(25, 0);
    expect(size(lg!)).toBeCloseTo(30, 0);
    expect(link(sm!).getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    expect(text(labelled!.querySelector(".ui-hgd__label"))).toBe("Read the guide");
    expect(labelled!.querySelector(".ui-hgd__tip")).toBeNull();
    expect(text(link(labelled!).querySelector(".tc-sr-only"))).toBe("Reassign cases in bulk, Read, opens in a new tab");
    expect(labelled!.querySelector(".ui-hgd__seen")).not.toBeNull();
  });

  test("opening fires tc-guide-open and marks it read; a page that prevents it keeps the link from navigating", async () => {
    const el = await guide();
    const opens: HelpGuideOpen[] = [];
    const reads: boolean[] = [];
    el.addEventListener("tc-guide-open", (e) => opens.push((e as CustomEvent<HelpGuideOpen>).detail));
    el.addEventListener("tc-read-change", (e) => reads.push((e as CustomEvent<{ read: boolean }>).detail.read));
    // Not prevented by the page: the element leaves the navigation alone (the test stops it at the window)
    let leftAlone = false;
    window.addEventListener("click", (e) => (leftAlone = !e.defaultPrevented), { once: true, capture: false });
    click(el);
    await settle();
    expect(opens).toEqual([{ href: HREF, heading: "Write a risk rule" }]);
    expect(leftAlone).toBe(true);
    expect(reads).toEqual([true]);
    expect(el.read).toBe(true);
    expect(el.hasAttribute("read")).toBe(true);
    expect(el.querySelector(".ui-hgd__seen")).not.toBeNull();
    // Prevented: the page shows the guide its own way, and the link doesn't navigate
    el.addEventListener("tc-guide-open", (e) => e.preventDefault());
    const ev = click(el);
    expect(ev.defaultPrevented).toBe(true);
    expect(reads).toEqual([true]);
  });

  test("a click with a modifier key is the browser's: no tc-guide-open, but it still counts as read", async () => {
    const el = await guide();
    let opened = 0;
    el.addEventListener("tc-guide-open", (e) => {
      opened++;
      e.preventDefault();
    });
    const ev = click(el, { metaKey: true });
    await settle();
    expect(opened).toBe(0);
    expect(ev.defaultPrevented).toBe(true); // stopped by the test, not the element
    expect(el.read).toBe(true);
  });

  test("the Updated dot shows for new-days days, says so, and clears when opened", async () => {
    const el = await fixture<TcHelpGuide>(html`<tc-help-guide heading="Write a risk rule" href=${HREF} minutes="5" updated-on="2026-11-17" .now=${NOW}></tc-help-guide>`);
    expect(el.showsUpdate).toBe(true);
    const dot = el.querySelector(".ui-hgd__new")!;
    expect(dot.getAttribute("aria-hidden")).toBe("true");
    expect(text(link(el).querySelector(".tc-sr-only"))).toBe("Read guide: Write a risk rule, 5 min read, Updated, opens in a new tab");
    expect(text(el.querySelector(".ui-hgd__tip"))).toBe("Write a risk rule · 5 min read · Updated");
    const mark = el.querySelector(".ui-hgd__mark")!.getBoundingClientRect();
    expect(dot.getBoundingClientRect().right).toBeGreaterThan(mark.right);
    expect(dot.getBoundingClientRect().top).toBeLessThan(mark.top);
    el.now = Date.UTC(2026, 11, 2);
    await settle();
    expect(el.querySelector(".ui-hgd__new")).toBeNull();
    el.now = NOW;
    await settle();
    const seen: boolean[] = [];
    el.addEventListener("tc-update-seen-change", (e) => seen.push((e as CustomEvent<{ updateSeen: boolean }>).detail.updateSeen));
    click(el);
    await settle();
    expect(seen).toEqual([true]);
    expect(el.updateSeen).toBe(true);
    expect(el.querySelector(".ui-hgd__new")).toBeNull();
    for (const bad of ["", "soon"]) {
      el.updatedOn = bad;
      el.updateSeen = false;
      await settle();
      expect(el.showsUpdate).toBe(false);
    }
  });

  test("prevented read and update events keep the state; renamed words show", async () => {
    const el = await fixture<TcHelpGuide>(
      html`<tc-help-guide heading="Rules" href=${HREF} minutes="4" updated-on="2026-11-17" .now=${NOW} .labels=${{ read: "Open guide", minutes: "{n} minutes", newTab: "new tab" }}></tc-help-guide>`,
    );
    expect(text(link(el).querySelector(".tc-sr-only"))).toBe("Open guide: Rules, 4 minutes, Updated, new tab");
    el.addEventListener("tc-read-change", (e) => e.preventDefault());
    el.addEventListener("tc-update-seen-change", (e) => e.preventDefault());
    click(el);
    await settle();
    expect(el.read).toBe(false);
    expect(el.updateSeen).toBe(false);
    expect(el.querySelector(".ui-hgd__new")).not.toBeNull();
  });
});

describe("React", () => {
  test("onGuideOpen can take the guide over; read is uncontrolled or controlled", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const opened: string[] = [];
    let asked: boolean | undefined;
    const node = (extra = {}) =>
      React.createElement(HelpGuide, {
        title: "Write a risk rule",
        href: HREF,
        minutes: 5,
        onGuideOpen: (d: HelpGuideOpen, e: CustomEvent<HelpGuideOpen>) => {
          e.preventDefault();
          opened.push(d.href);
        },
        ...extra,
      });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcHelpGuide>("tc-help-guide")!;
    expect(el.heading).toBe("Write a risk rule");
    let ev!: MouseEvent;
    await act(async () => {
      ev = click(el);
    });
    expect(opened).toEqual([HREF]);
    expect(ev.defaultPrevented).toBe(true);
    await act(async () => root.render(node()));
    await settle();
    expect(el.read).toBe(true);
    await act(async () => root.render(node({ read: false, onReadChange: (r: boolean) => (asked = r) })));
    await settle();
    expect(el.read).toBe(false);
    await act(async () => {
      click(el);
    });
    await settle();
    expect(asked).toBe(true);
    expect(el.read).toBe(false);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(
          html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas; color: CanvasText`}>
            <h2>Risk rules <tc-help-guide look=${look} heading="Write a risk rule" href=${HREF} minutes="5" updated-on="2026-11-17" .now=${NOW}></tc-help-guide></h2>
            <p>Reassign <tc-help-guide look=${look} heading="Reassign cases in bulk" href=${HREF} label="Read the guide" size="sm" read></tc-help-guide></p>
          </div>`,
        );
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
