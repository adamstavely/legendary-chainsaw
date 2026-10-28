/*
 * <tc-agent-gallery> in real browsers: the head, the tripled track with the open panel in the middle, picking a side
 * panel or using the arrows and keys, the quiet jump back into the middle copy, focus that never drops to <body>,
 * the persistent live caption, controlled `index`, narrow width, the React wrapper and the block on it, and axe in
 * both looks and both themes. Ported from the jsdom regressions of blocks/agent-gallery.tsx.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/agent-gallery";
import type { GalleryIndexChange, GalleryItem, TcAgentGallery } from "../../src/elements/agent-gallery";
import { AgentGallery } from "../../src/elements/react/agent-gallery";
import { AgentGallery as AgentGalleryBlock } from "../../blocks/agent-gallery";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const item = (id: string, name: string): GalleryItem => ({
  id,
  name,
  description: `${name} does things.`,
  colors: ["#8b5cf6", "#e9d5ff"],
  trigger: "Ticket created",
  steps: ["One.", "Two.", "Three."],
  skills: ["Classify"],
  guardrail: "Cannot close tickets",
});
const ITEMS = [item("a", "Alpha"), item("b", "Beta"), item("c", "Gamma"), item("d", "Delta")];

const make = (extra: { index?: number; items?: GalleryItem[] } = {}, look: "standard" | "clean" = "standard") =>
  fixture<HTMLElement>(html`<div style="width: 1100px"><tc-agent-gallery look=${look} .items=${extra.items ?? ITEMS} .index=${extra.index}></tc-agent-gallery></div>`).then(
    (w) => w.querySelector("tc-agent-gallery")!,
  );
const caption = (el: Element) => el.querySelector(".ui-ag__caption b")?.textContent;
const visiblePicks = (el: Element, name: string) =>
  [...el.querySelectorAll<HTMLElement>(".ui-ag__pick")].filter((b) => !b.closest('[aria-hidden="true"]') && b.getAttribute("aria-label") === `Show ${name}`);
const arrow = (el: Element, label: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-ag__arrows button")].find((b) => b.textContent!.includes(label))!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("<tc-agent-gallery>", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`structure (${look}): a named carousel, three copies of the panels, the middle one open`, async () => {
      const el = await make({}, look);
      expect(el.dataset.ui).toBe("ag");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("aria-roledescription")).toBe("carousel");
      expect(el.getAttribute("aria-label")).toBe("Agents that run your playbook");
      expect(el.querySelectorAll(".ui-ag__panel")).toHaveLength(12);
      expect(el.querySelectorAll(".ui-ag__panel[data-open]")).toHaveLength(1);
      expect(caption(el)).toBe("Gamma.");
      const open = el.querySelector(".ui-ag__panel[data-open] .ui-ag__screen")!;
      expect(open.getAttribute("role")).toBe("group");
      expect(open.getAttribute("aria-label")).toBe("Gamma workspace");
      expect(open.hasAttribute("aria-hidden")).toBe(false);
    });
  }

  test("defaults: seven made-up agents, the middle one open", async () => {
    const el = await fixture<TcAgentGallery>(html`<tc-agent-gallery></tc-agent-gallery>`);
    expect(el.items).toHaveLength(7);
    expect(caption(el)).toBe("Churn watch.");
  });

  test("picking a side panel moves focus into the panel that opens, not to <body>", async () => {
    const el = await make();
    const pick = visiblePicks(el, "Delta")[0];
    pick.focus();
    pick.click();
    await settle(el);
    expect(pick.isConnected).toBe(false);
    const screen = el.querySelector(".ui-ag__panel[data-open] .ui-ag__screen")!;
    expect(document.activeElement).toBe(screen);
    expect(screen.getAttribute("aria-label")).toBe("Delta workspace");
    expect(caption(el)).toBe("Delta.");
  });

  test("after the quiet jump back to the middle copy, focus moves to the same agent's visible button", async () => {
    const el = await fixture<TcAgentGallery>(html`<div style="width: 1100px"><tc-agent-gallery index="6"></tc-agent-gallery></div>`).then((w) => w.querySelector("tc-agent-gallery")!);
    // Next from the last agent glides into the third copy, then quietly jumps back to the middle one
    arrow(el, "Next agent").click();
    await settle(el);
    const [before] = visiblePicks(el, "Release notes");
    before.focus();
    // The glide, then the quiet jump: wait for the jump to have happened rather than a fixed time (WebKit runners are slow)
    await expect.poll(() => before.closest('[aria-hidden="true"]') !== null && !el.querySelector(".ui-ag__track[data-snap]"), { timeout: 5000 }).toBe(true);
    await settle(el);
    await expect.poll(() => (document.activeElement as HTMLElement | null)?.getAttribute("aria-label")).toBe("Show Release notes");
    const active = document.activeElement as HTMLElement;
    expect(active).not.toBe(before);
    expect(active.getAttribute("aria-label")).toBe("Show Release notes");
    expect(active.closest('[aria-hidden="true"], [inert]')).toBeNull();
    expect(el.querySelector(".ui-ag__track[data-snap]")).toBeNull();
  });

  test("the caption is one persistent live region; the arrows are library buttons; arrow keys move", async () => {
    const el = await make();
    const live = el.querySelector('[aria-live="polite"]')!;
    expect(arrow(el, "Next agent").closest("tc-button")).toBeTruthy();
    arrow(el, "Next agent").click();
    await settle(el);
    expect(el.querySelector('[aria-live="polite"]')).toBe(live);
    expect(caption(el)).toBe("Delta.");
    key(el.querySelector(".ui-ag__viewport")!, "ArrowLeft");
    await settle(el);
    key(el.querySelector(".ui-ag__viewport")!, "ArrowLeft");
    await settle(el);
    expect(caption(el)).toBe("Beta.");
  });

  test("tc-index-change carries the index and item; preventDefault keeps the open agent", async () => {
    const el = await make();
    const seen: [number, string][] = [];
    el.addEventListener("tc-index-change", (e) => {
      const d = (e as CustomEvent<GalleryIndexChange>).detail;
      seen.push([d.index, d.item.id]);
      e.preventDefault();
    });
    arrow(el, "Previous agent").click();
    await settle(el);
    expect(seen).toEqual([[1, "b"]]);
    expect(caption(el)).toBe("Gamma.");
  });

  test("controlled: a new index glides there the short way round", async () => {
    const el = await make({ index: 0 });
    expect(caption(el)).toBe("Alpha.");
    (el as TcAgentGallery).index = 3;
    await settle(el);
    expect(caption(el)).toBe("Delta.");
    // 0 → 3 is one step back round the loop, not three forward
    expect(Number((el.querySelector(".ui-ag__track") as HTMLElement).style.getPropertyValue("--pos"))).toBe(3);
  });

  test("distant panels are hidden from screen readers and out of the tab order", async () => {
    const el = await make();
    const hidden = [...el.querySelectorAll(".ui-ag__panel[aria-hidden='true']")];
    expect(hidden.length).toBeGreaterThan(0);
    expect(hidden.every((p) => p.querySelector(".ui-ag__pick")?.getAttribute("tabindex") === "-1")).toBe(true);
  });

  test("bad data: no items render the head and an empty track; odd colours fall back", async () => {
    const el = await make({ items: [] });
    expect(el.querySelectorAll(".ui-ag__panel")).toHaveLength(0);
    (el as TcAgentGallery).items = [{ ...item("x", "X"), colors: ["red; background: url(//evil)" as string, "blue"] }];
    await settle(el);
    expect((el.querySelector(".ui-ag__panel") as HTMLElement).style.getPropertyValue("--a").trim()).toBe("transparent");
  });

  test("narrow: the open panel takes most of the width and the page doesn't scroll sideways", async () => {
    const w = await fixture(html`<div style="width: 380px"><tc-agent-gallery .items=${ITEMS}></tc-agent-gallery></div>`);
    const el = w.querySelector("tc-agent-gallery")!;
    const open = el.querySelector<HTMLElement>(".ui-ag__panel[data-open]")!;
    await expect.poll(() => open.getBoundingClientRect().width).toBeGreaterThan(180);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React wrapper: an uncontrolled pick survives parent re-renders; onIndexChange reports it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: number[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(AgentGallery, { title: "Agents", items: ITEMS, defaultIndex: 1, onIndexChange: (i: number) => void seen.push(i), "data-n": n } as React.ComponentProps<typeof AgentGallery>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-agent-gallery")!;
    expect(caption(el)).toBe("Beta.");
    arrow(el, "Next agent").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(caption(el)).toBe("Gamma.");
    expect(seen).toEqual([2]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled index stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: number[] = [];
    const render = (index: number) => root.render(React.createElement(AgentGallery, { items: ITEMS, index, onIndexChange: (i: number) => void asked.push(i) }));
    await act(async () => render(0));
    await settle();
    const el = host.querySelector("tc-agent-gallery")!;
    arrow(el, "Next agent").click();
    await settle();
    expect(asked).toEqual([1]);
    expect(caption(el)).toBe("Alpha.");
    await act(async () => render(1));
    await settle();
    expect(caption(el)).toBe("Beta.");
    await act(async () => root.unmount());
  });

  test("the block: className and DOM props reach the element, which is its ref", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const ref = React.createRef<HTMLElement>();
    await act(async () => root.render(React.createElement(AgentGalleryBlock, { ref, className: "mine", ...({ "data-x": "1" } as object), items: ITEMS, defaultIndex: 3 })));
    await settle();
    const el = host.querySelector("tc-agent-gallery")!;
    expect(ref.current).toBe(el);
    expect(el.classList.contains("mine") && el.classList.contains("ui-ag")).toBe(true);
    expect(el.getAttribute("data-x")).toBe("1");
    expect(caption(el)).toBe("Delta.");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="width: 1100px; padding: 16px; background: var(--tc-surface-base)">
        <tc-agent-gallery .items=${ITEMS}></tc-agent-gallery>
        <tc-agent-gallery look="clean" heading="Clean gallery"></tc-agent-gallery>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
