/*
 * <tc-loupe> in real browsers: on and off (the hotkey, Escape, Close, the start button), finding components and their
 * cards, the breakpoints, the layout scan, following the page, the lists' keys, the helpers, the React wrapper and axe
 * in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/loupe";
import "../../src/elements/button";
import { breakpointApplies, breakpointRange, type LoupeSelect, type TcLoupe } from "../../src/elements/loupe";
import { Loupe } from "../../src/elements/react/loupe";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const key = (target: EventTarget, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, composed: true, ...init }));

/** A page with two marked components (one in a grid), a library button, and a Loupe looking only at it */
async function make(opts: { look?: string; active?: boolean; floating?: boolean } = {}) {
  const wrap = await fixture<HTMLElement>(html`<div>
    <section id="page" style="padding: 8px">
      <header data-ds-component="PageHeader" data-ds-path="src/PageHeader.tsx" style="display: flex; gap: 8px; height: 40px">Settings</header>
      <div id="grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
        <div data-ds-component="StatCard" style="height: 60px">Members</div>
        <div data-ds-component="StatCard" style="height: 60px">Storage</div>
      </div>
      <tc-button>Save</tc-button>
      <div data-ds-component="Hidden" style="display: none">x</div>
    </section>
    <tc-loupe look=${opts.look ?? "standard"} .floating=${opts.floating ?? false} .hotkey=${"mod+shift+l"} ?active=${opts.active ?? false}></tc-loupe>
  </div>`);
  const el = wrap.querySelector<TcLoupe>("tc-loupe")!;
  el.root = wrap.querySelector("#page");
  el.components = { StatCard: { description: "A number and its label.", docs: "https://design.example/stat-card", source: "javascript:alert(1)" } };
  await settle();
  await frame();
  await settle();
  return { wrap, el, page: wrap.querySelector<HTMLElement>("#page")! };
}
const names = (el: Element) => [...el.querySelectorAll(".ui-lpe__list [role='option'] .ui-lpe__item-name")].map(text);

describe("tc-loupe", () => {
  test("helpers: which breakpoints apply, and their ranges in words", () => {
    expect(breakpointApplies({ id: "md", min: 768 }, 800)).toBe(true);
    expect(breakpointApplies({ id: "md", min: 768 }, 700)).toBe(false);
    expect(breakpointApplies({ id: "s", min: 640, max: 767 }, 767)).toBe(true);
    expect(breakpointApplies({ id: "x" }, 800)).toBe(false);
    expect(breakpointRange({ id: "a", min: 640 })).toBe("≥ 640 px");
    expect(breakpointRange({ id: "a", max: 639 })).toBe("≤ 639 px");
    expect(breakpointRange({ id: "a", min: 640, max: 1023 })).toBe("640–1023 px");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: off and in the page, a card with Inspect; on, the panel, its lists and the outlines`, async () => {
      const { el } = await make({ look });
      expect(el.dataset.ui).toBe("lpe");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector('[role="region"]')!.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      expect(el.querySelector(".ui-lpe__layer")).toBeNull();
      el.querySelector<HTMLButtonElement>(".ui-lpe__start")!.click();
      await settle();
      await frame();
      await settle();
      expect(el.active).toBe(true);
      // The marked components and the library's button; not the hidden one, not the Loupe
      expect(names(el)).toEqual(["PageHeader", "StatCard", "StatCard", "Button"]);
      expect(el.querySelectorAll(".ui-lpe__outline")).toHaveLength(4);
      expect([...el.querySelectorAll('[role="switch"]')].map((s) => [text(s), s.getAttribute("aria-checked")])).toEqual([
        ["Components 4", "true"],
        ["Breakpoints", "true"],
        ["Layouts", "false"],
      ]);
      expect(el.querySelector(".ui-lpe__ruler")).not.toBeNull();
      expect(text(el.querySelector(".tc-head__sub"))).toMatch(new RegExp(`^${window.innerWidth} × ${window.innerHeight} · `));
    });
  }

  test("the card: hover a component for its name, path, size and safe links; the outline follows", async () => {
    const { el, page } = await make({ active: true });
    const card = page.querySelectorAll('[data-ds-component="StatCard"]')[1];
    card.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    await settle();
    const c = el.querySelector(".ui-lpe__card")!;
    expect(c.getAttribute("aria-label")).toBe("StatCard details");
    expect(text(c.querySelector(".ui-lpe__card-desc"))).toBe("A number and its label.");
    expect(text(c.querySelector(".ui-lpe__card-meta"))).toMatch(/^\d+ × 60$/);
    // A javascript: link from the page's data never becomes an href
    expect([...c.querySelectorAll("a")].map((a) => [text(a), a.getAttribute("href")])).toEqual([["Docs", "https://design.example/stat-card"]]);
    expect(el.querySelectorAll(".ui-lpe__outline[data-on]")).toHaveLength(1);
    expect(text(el.querySelector(".ui-lpe__outline[data-on] .ui-lpe__tag"))).toBe("StatCard");
    // The header's path, from data-ds-path; a library element's, its tag
    page.querySelector("header")!.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    await settle();
    expect(text(el.querySelector(".ui-lpe__card-path"))).toBe("src/PageHeader.tsx");
    page.querySelector("tc-button")!.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    await settle();
    expect(text(el.querySelector(".ui-lpe__card-path"))).toBe("<tc-button>");
    document.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(el.querySelector(".ui-lpe__card")).toBeNull();
  });

  test("the list: arrows pick a component (tc-select) and keep its card up; Escape lets it go, then turns it off", async () => {
    const { el } = await make({ active: true });
    const picks: LoupeSelect[] = [];
    el.addEventListener("tc-select", (e) => picks.push((e as CustomEvent<LoupeSelect>).detail));
    const list = el.querySelector<HTMLElement>(".ui-lpe__list")!;
    expect(list.getAttribute("role")).toBe("listbox");
    list.focus();
    key(list, "ArrowDown");
    await settle();
    await frame();
    await settle();
    expect(picks.map((p) => p.info.name)).toEqual(["StatCard"]);
    expect(list.getAttribute("aria-activedescendant")).toBe(el.querySelectorAll('[role="option"]')[1].id);
    expect(el.querySelectorAll('[role="option"]')[1].getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector(".ui-lpe__card")).not.toBeNull();
    key(list, "End");
    await settle();
    expect(picks.map((p) => p.info.name)).toEqual(["StatCard", "Button"]);
    key(list, "Escape");
    await settle();
    expect(el.active).toBe(true);
    expect(el.querySelector('[role="option"][aria-selected="true"]')).toBeNull();
    key(list, "Escape");
    await expect.poll(() => el.active).toBe(false);
  });

  test("on and off: the hotkey, Close and Escape ask with a cancelable tc-active-change; an open dialog keeps Escape", async () => {
    const { el } = await make();
    const asks: boolean[] = [];
    el.addEventListener("tc-active-change", (e) => asks.push((e as CustomEvent).detail.active));
    key(document.body, "L", { shiftKey: true, ctrlKey: true, metaKey: true });
    await settle();
    expect(el.active).toBe(true);
    // Escape inside an open dialog on the page is the dialog's
    const dialog = document.createElement("dialog");
    dialog.innerHTML = "<button>ok</button>";
    document.body.append(dialog);
    dialog.show();
    key(dialog.querySelector("button")!, "Escape");
    await settle();
    expect(el.active).toBe(true);
    dialog.remove();
    el.addEventListener("tc-active-change", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLButtonElement>(".ui-lpe__close")!.click();
    await settle();
    expect(el.active).toBe(true);
    key(document.body, "Escape");
    await expect.poll(() => el.active).toBe(false);
    expect(asks).toEqual([true, false, false]);
    el.hotkey = false;
    await settle();
    key(document.body, "L", { shiftKey: true, ctrlKey: true, metaKey: true });
    await settle();
    expect(el.active).toBe(false);
  });

  test("Escape is the page's first: an open popover keeps it, and so does a page handler that prevents it", async () => {
    const { el } = await make({ active: true });
    // An open popover on the page (a library card, a menu) has Escape
    const pop = document.createElement("div");
    pop.popover = "manual";
    pop.innerHTML = "<button>inside</button>";
    document.body.append(pop);
    pop.showPopover();
    key(document.body, "Escape");
    await settle();
    await new Promise((r) => setTimeout(r, 20));
    expect(el.active).toBe(true);
    pop.remove();
    // A handler bound on the document after the Loupe started still gets to say Escape was its own
    const mine = (e: KeyboardEvent) => e.key === "Escape" && e.preventDefault();
    document.addEventListener("keydown", mine);
    key(document.body, "Escape");
    await settle();
    await new Promise((r) => setTimeout(r, 20));
    expect(el.active).toBe(true);
    document.removeEventListener("keydown", mine);
    key(document.body, "Escape");
    await expect.poll(() => el.active).toBe(false);
  });

  test("moved while on, it keeps working: listening, outlining and its layer showing", async () => {
    const { wrap, el, page } = await make({ active: true });
    expect(el.querySelectorAll(".ui-lpe__outline")).toHaveLength(4);
    // A framework moving it: out of the page and back in
    const holder = document.createElement("div");
    wrap.append(holder);
    holder.append(el);
    await settle();
    await frame();
    await settle();
    expect(el.active).toBe(true);
    expect(el.querySelectorAll(".ui-lpe__outline")).toHaveLength(4);
    expect(el.querySelector(".ui-lpe__layer")!.matches(":popover-open")).toBe(true);
    page.querySelector("header")!.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-lpe__card")).not.toBeNull();
    key(document.body, "Escape");
    await expect.poll(() => el.active).toBe(false);
  });

  test("breakpoints: the panel marks the current one; the ruler draws each", async () => {
    const { el } = await make({ active: true });
    const w = window.innerWidth;
    el.breakpoints = [
      { id: "s", label: "Small", max: w + 100 },
      { id: "m", label: "Medium", min: Math.max(0, w - 100) },
      { id: "l", label: "Large", min: w + 1 },
    ];
    await settle();
    const rows = [...el.querySelectorAll(".ui-lpe__bp")];
    expect(rows.map((r) => text(r.querySelector(".ui-lpe__bp-state")))).toEqual(["Applies", "Current", ""]);
    expect(el.querySelectorAll(".ui-lpe__tick")).toHaveLength(3);
    expect(text(el.querySelector(".ui-lpe__now-label"))).toBe(`${w}px`);
    expect(text(el.querySelector(".tc-head__sub"))).toMatch(/· Medium$/);
    // Switched off, the ruler goes; the switch can be held by the page
    el.querySelectorAll<HTMLButtonElement>('[role="switch"]')[1].click();
    await settle();
    expect(el.querySelector(".ui-lpe__ruler")).toBeNull();
    el.addEventListener("tc-feature-change", (e) => e.preventDefault(), { once: true });
    el.querySelectorAll<HTMLButtonElement>('[role="switch"]')[1].click();
    await settle();
    expect(el.showRuler).toBe(false);
  });

  test("layouts: flex and grid containers found, listed with direction and gap, outlined when picked", async () => {
    const { el } = await make({ active: true });
    el.querySelectorAll<HTMLButtonElement>('[role="switch"]')[2].click();
    await expect.poll(() => el.querySelectorAll(".ui-lpe__list")[1]?.querySelectorAll('[role="option"]').length ?? 0).toBeGreaterThanOrEqual(2);
    // The list is named by its heading alone, not by the Scan again button beside it
    const layoutList = el.querySelectorAll(".ui-lpe__list")[1];
    expect(text(document.getElementById(layoutList.getAttribute("aria-labelledby")!))).toMatch(/^Layouts \d+$/);
    const items = [...layoutList.querySelectorAll('[role="option"]')];
    const grid = items.find((i) => text(i).includes("div#grid"))!;
    expect(text(grid)).toContain("Grid");
    expect(text(grid.querySelector(".ui-lpe__item-path"))).toContain("gap 12px");
    expect(items.some((i) => text(i).startsWith("Flex") && text(i).includes("header"))).toBe(true);
    (grid as HTMLElement).click();
    await settle();
    await frame();
    await settle();
    expect(text(el.querySelector(".ui-lpe__layout[data-on] .ui-lpe__layout-label"))).toMatch(/^grid · .* · gap 12px$/);
  });

  test("it follows the page: new components appear, removed ones go; off, nothing is left listening", async () => {
    const { el, page } = await make({ active: true });
    const extra = document.createElement("div");
    extra.dataset.dsComponent = "Banner";
    extra.style.height = "20px";
    page.append(extra);
    await expect.poll(() => names(el)).toContain("Banner");
    extra.remove();
    await expect.poll(() => names(el)).not.toContain("Banner");
    el.active = false;
    await settle();
    expect(el.querySelector(".ui-lpe__layer")).toBeNull();
    page.querySelector("header")!.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-lpe__card")).toBeNull();
  });

  test("floating: nothing while off unless launcher; on, the panel is fixed at the corner", async () => {
    const { el } = await make({ floating: true });
    expect(el.querySelector(".ui-lpe__panel")).toBeNull();
    el.launcher = true;
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-lpe__launcher")!.click();
    await settle();
    expect(el.active).toBe(true);
    expect(getComputedStyle(el).position).toBe("fixed");
  });

  test("React wrapper: uncontrolled active survives parent re-renders; controlled stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: boolean[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(Loupe, { title: "Inspector", floating: false, hotkey: false, onActiveChange: (a) => void asked.push(a), "data-n": n } as React.ComponentProps<typeof Loupe>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-loupe")!;
    expect(text(el.querySelector(".tc-head__title"))).toBe("Inspector");
    el.querySelector<HTMLButtonElement>(".ui-lpe__start")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.active).toBe(true);
    expect(asked).toEqual([true]);
    await act(async () => root.render(React.createElement(Loupe, { floating: false, hotkey: false, active: false })));
    await settle();
    // A new tree: a new element, controlled off
    const held = host.querySelector("tc-loupe")!;
    held.querySelector<HTMLButtonElement>(".ui-lpe__start")!.click();
    await settle();
    expect(held.active).toBe(false);
    await act(async () => root.unmount());
  });

  test("React wrapper: the switches survive parent re-renders uncontrolled, and stay put controlled", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(Loupe, { floating: false, hotkey: false, defaultActive: true, "data-n": n } as React.ComponentProps<typeof Loupe>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    let el = host.querySelector("tc-loupe")!;
    el.querySelectorAll<HTMLButtonElement>('[role="switch"]')[2].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.showLayouts).toBe(true);
    // Controlled: the parent's value holds until it changes it
    const seen: boolean[] = [];
    await act(async () => root.render(React.createElement(Loupe, { floating: false, hotkey: false, defaultActive: true, showRuler: true, onFeatureChange: (d) => void seen.push(d.on) })));
    await settle();
    el = host.querySelector("tc-loupe")!;
    el.querySelectorAll<HTMLButtonElement>('[role="switch"]')[1].click();
    await settle();
    expect(seen).toEqual([false]);
    expect(el.showRuler).toBe(true);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, off and on`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <div id="p"><div data-ds-component="Card" style="height: 40px; color: var(--tc-text-primary)">Card</div></div>
        <tc-loupe .floating=${false} .hotkey=${false}></tc-loupe>
        <tc-loupe look="clean" .floating=${false} .hotkey=${false} active></tc-loupe>
      </div>`);
      const [, on] = wrap.querySelectorAll<TcLoupe>("tc-loupe");
      on.root = wrap.querySelector("#p");
      on.showLayouts = true;
      await settle();
      await expect.poll(() => text(on.querySelector(".ui-lpe__section:last-of-type .ui-lpe__empty"))).toBe("No flex or grid containers here.");
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
