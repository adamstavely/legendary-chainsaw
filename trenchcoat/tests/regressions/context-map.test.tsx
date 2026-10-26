/* context-map: the motion loop re-rendered on every frame forever, even when idle (H1) */
import { Profiler, StrictMode, type ReactNode } from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/context-map";
import * as clean from "@components/context-map-clean";
import type { ContextBlock } from "@components/context-map";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const FRAME = 16;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] });
  // jsdom has no layout: give the map an area, so tiles are laid out and the motion writes to them
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(640);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(320);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private cb: () => void) {}
      observe() {
        this.cb();
      }
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const frames = async (ms: number) => {
  for (let t = 0; t < ms; t += FRAME) {
    await act(async () => {
      vi.advanceTimersByTime(FRAME);
    });
  }
};

const BLOCKS: ContextBlock[] = [
  { id: "sys", label: "System prompt", kind: "system", tokens: 3200 },
  { id: "tools", label: "Tools", kind: "tools", tokens: 14800 },
  { id: "f1", label: "checkout.ts", kind: "file", tokens: 18400 },
];

for (const [style, ui] of styles) {
  describe(`context-map ${style}`, () => {
    const mount = (blocks: ContextBlock[]) => {
      const count = { commits: 0 };
      const wrap = (b: ContextBlock[]): ReactNode => (
        <StrictMode>
          <Profiler id="map" onRender={() => count.commits++}>
            <ui.ContextMap blocks={b} limit={200_000} />
          </Profiler>
        </StrictMode>
      );
      const view = render(wrap(blocks));
      return { count, view, rerender: (b: ContextBlock[]) => view.rerender(wrap(b)) };
    };
    const tiles = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>('[role="listitem"]')];
    const geometry = (el: HTMLElement) => tiles(el).map((t) => ["--x", "--y", "--w", "--h"].map((p) => t.style.getPropertyValue(p)).join(" "));

    test("no React commits once the tiles have settled", async () => {
      const { count, view } = mount(BLOCKS);
      await frames(2000);
      expect(tiles(view.container).length).toBe(4);
      count.commits = 0;
      await frames(2000);
      expect(count.commits).toBe(0);
      // Nothing left running either
      view.unmount();
      expect(vi.getTimerCount()).toBe(0);
    });

    test("a parent rendering the same blocks again doesn't restart the motion", async () => {
      const { count, rerender } = mount(BLOCKS);
      await frames(2000);
      count.commits = 0;
      rerender(BLOCKS.map((b) => ({ ...b })));
      await frames(1000);
      expect(count.commits).toBe(1);
    });

    test("growing tiles glide without a commit per frame, and end where a render puts them", async () => {
      const { count, view, rerender } = mount(BLOCKS);
      await frames(2000);
      count.commits = 0;
      rerender([...BLOCKS, { id: "f2", label: "payment-intent.ts", kind: "file", tokens: 42_000 }]);
      const before = geometry(view.container);
      await frames(1500);
      expect(count.commits).toBeLessThan(1500 / FRAME / 4);
      const settled = geometry(view.container);
      expect(settled).not.toEqual(before);
      // A map mounted with those blocks from the start comes to rest exactly where the frames left this one
      const fresh = mount([...BLOCKS, { id: "f2", label: "payment-intent.ts", kind: "file", tokens: 42_000 }]);
      await frames(2000);
      expect(geometry(fresh.view.container)).toEqual(settled);
      expect(tiles(view.container).map((t) => t.querySelector(".ui-cxm__hit")?.getAttribute("aria-label"))).toContain("payment-intent.ts, File – 42k tokens");
    });

    test("agent: uncontrolled switches on its own, controlled only reports", async () => {
      const blocks: ContextBlock[] = [{ id: "sys", label: "System", kind: "system", tokens: 4000 }];
      const agents = [
        { id: "a", name: "Checkout fixer", limit: 200000 },
        { id: "b", name: "Docs writer", limit: 500000 },
      ];
      const onAgentChange = vi.fn();
      const pick = (container: HTMLElement) => {
        act(() => (container.querySelector(".ui-cxm__agent") as HTMLElement).click());
        act(() => ([...container.querySelectorAll(".ui-cxm__option")].find((o) => o.textContent!.includes("Docs writer")) as HTMLElement).click());
      };
      const name = (container: HTMLElement) => container.querySelector(".ui-cxm__agent .ui-cxm__model")!.textContent;

      const free = render(<ui.ContextMap blocks={blocks} limit={200000} agents={agents} onAgentChange={onAgentChange} />);
      pick(free.container);
      expect(onAgentChange).toHaveBeenCalledWith("b");
      expect(name(free.container)).toBe("Docs writer");
      free.unmount();

      const held = render(<ui.ContextMap blocks={blocks} limit={200000} agents={agents} agent="a" onAgentChange={onAgentChange} />);
      pick(held.container);
      expect(onAgentChange).toHaveBeenCalledTimes(2);
      expect(name(held.container)).toBe("Checkout fixer");
    });

    test("view: defaultView is honoured on mount, and a new compaction shows After again", async () => {
      const blocks: ContextBlock[] = [{ id: "sys", label: "System", kind: "system", tokens: 4000 }];
      const pressed = (c: HTMLElement) => c.querySelector('.ui-cxm__compare [aria-pressed="true"]')!.textContent;
      const first = { before: blocks };
      const view = render(<ui.ContextMap blocks={blocks} limit={200000} compaction={first} defaultView="before" />);
      await frames(50);
      expect(pressed(view.container)).toBe("Before");
      view.rerender(<ui.ContextMap blocks={blocks} limit={200000} compaction={{ before: blocks }} defaultView="before" />);
      await frames(50);
      expect(pressed(view.container)).toBe("After");
    });
  });
}

/* WCAG fix pass: tiles were pointer-only (2.1.1, critical), details only in a hover card (1.4.13), the agent menu had no
   menu keyboard (4.1.2), focus fell to <body> after picking, and the status wasn't announced (4.1.3) */
for (const [style, ui] of styles) {
  describe(`context-map ${style} – keyboard and announcements`, () => {
    const AGENTS = [
      { id: "a", name: "Checkout fixer", limit: 200000 },
      { id: "b", name: "Docs writer", limit: 500000 },
    ];
    const hits = (el: HTMLElement) => [...el.querySelectorAll<HTMLButtonElement>(".ui-cxm__hit")];

    test("every block is a named button with one tab stop; arrow keys move between them", async () => {
      const onSelect = vi.fn();
      const { container } = render(<ui.ContextMap blocks={BLOCKS} limit={200_000} onSelect={onSelect} />);
      await frames(1000);
      const b = hits(container);
      expect(b.map((x) => x.getAttribute("aria-label"))).toEqual(["System prompt, System prompt – 3.2k tokens", "Tools, Tools – 14.8k tokens", "checkout.ts, File – 18.4k tokens"]);
      expect(b.map((x) => x.tabIndex)).toEqual([0, -1, -1]);
      act(() => b[0].focus());
      fireEvent.keyDown(b[0], { key: "ArrowRight" });
      expect(document.activeElement).toBe(hits(container)[1]);
      fireEvent.keyDown(document.activeElement!, { key: "End" });
      expect(document.activeElement).toBe(hits(container)[2]);
      expect(hits(container).map((x) => x.tabIndex)).toEqual([-1, -1, 0]);
      // Enter/Space work as on any button: a click pins and selects
      act(() => hits(container)[2].click());
      expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: "f1" }));
      expect(hits(container)[2].getAttribute("aria-pressed")).toBe("true");
    });

    test("focus shows the card (described by it), Escape hides it without moving focus", async () => {
      const { container } = render(<ui.ContextMap blocks={BLOCKS} limit={200_000} />);
      await frames(1000);
      const tools = hits(container)[1];
      act(() => tools.focus());
      const tip = container.querySelector<HTMLElement>('[role="tooltip"]')!;
      expect(tip.textContent).toContain("Tools");
      expect(tools.getAttribute("aria-describedby")).toBe(tip.id);
      fireEvent.keyDown(document, { key: "Escape" });
      expect(container.querySelector('[role="tooltip"]')).toBeNull();
      expect(document.activeElement).toBe(tools);
    });

    test("before a compaction, the block's fate is in its name", async () => {
      const compaction = { before: BLOCKS, summarized: ["f1"], dropped: ["tools"] };
      const { container } = render(<ui.ContextMap blocks={BLOCKS} limit={200_000} compaction={compaction} defaultView="before" />);
      await frames(1000);
      expect(hits(container).map((x) => x.getAttribute("aria-label"))).toEqual([
        "System prompt, System prompt – 3.2k tokens, kept",
        "Tools, Tools – 14.8k tokens, dropped",
        "checkout.ts, File – 18.4k tokens, summarized",
      ]);
    });

    test("agent menu: focus moves in, arrows move, picking returns focus to the button, Escape too", async () => {
      const { container } = render(<ui.ContextMap blocks={BLOCKS} limit={200_000} agents={AGENTS} />);
      const trigger = container.querySelector<HTMLButtonElement>(".ui-cxm__agent")!;
      act(() => trigger.focus());
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
      const items = () => [...container.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
      expect(document.activeElement).toBe(items()[0]);
      fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
      expect(document.activeElement).toBe(items()[1]);
      fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
      expect(document.activeElement).toBe(items()[0]);
      fireEvent.keyDown(document, { key: "Escape" });
      expect(container.querySelector('[role="menu"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
      // Click opens on the checked item; picking closes and focus is back on the button, not <body>
      act(() => trigger.click());
      expect(document.activeElement).toBe(items()[0]);
      act(() => items()[1].click());
      expect(container.querySelector('[role="menu"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
      expect(trigger.textContent).toContain("Docs writer");
    });

    test("the status is announced through a region that's there from mount", async () => {
      const { container, rerender } = render(<ui.ContextMap blocks={BLOCKS} limit={200_000} />);
      const region = container.querySelector('[role="status"]');
      expect(region).not.toBeNull();
      expect(region!.textContent).toBe("");
      rerender(<ui.ContextMap blocks={BLOCKS} limit={200_000} status="Compacting" />);
      expect(container.querySelector('[role="status"]')).toBe(region);
      expect(region!.textContent).toBe("Compacting");
    });
  });
}
