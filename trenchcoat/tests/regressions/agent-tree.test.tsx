/* agent-tree: the follow loop set new connector state on every frame, re-rendering the whole tree (H12) */
import { Profiler, StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/agent-tree";
import * as clean from "@components/agent-tree-clean";
import type { TreeAgent } from "@components/agent-tree";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const FRAME = 16;

// jsdom has no layout: cards sit side by side, all shifted by `shift` – moving it is a glide the connectors follow
let shift = 0;
beforeEach(() => {
  shift = 0;
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] });
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    if (!/__node\b/.test(String(this.className))) return new DOMRect(0, 0, 800, 400);
    // The root on top, the rest in a row below it
    const i = [...document.querySelectorAll('[class$="__node"]')].indexOf(this);
    return new DOMRect(Math.max(0, i - 1) * 220 + shift, i ? 160 : 0, 200, 80);
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const frames = async (ms: number, each?: () => void) => {
  for (let t = 0; t < ms; t += FRAME) {
    each?.();
    await act(async () => {
      vi.advanceTimersByTime(FRAME);
    });
  }
};

const ROOT: TreeAgent = {
  id: "lead",
  name: "Lead",
  task: "Plan the migration",
  status: "done",
  children: [
    { id: "a", name: "Schema", task: "Map the tables", status: "done" },
    { id: "b", name: "Tests", task: "Port the tests", status: "queued" },
  ],
};

for (const [style, ui] of styles) {
  describe(`agent-tree ${style}`, () => {
    const mount = () => {
      const count = { commits: 0 };
      const view = render(
        <StrictMode>
          <Profiler id="tree" onRender={() => count.commits++}>
            <ui.AgentTree root={ROOT} />
          </Profiler>
        </StrictMode>,
      );
      const paths = () => [...view.container.querySelectorAll('svg[class$="__links"] path')].map((p) => p.getAttribute("d"));
      return { count, view, paths };
    };

    test("connectors follow gliding cards without a React commit per frame", async () => {
      const { count, paths } = mount();
      await frames(100);
      const start = paths();
      expect(start.length).toBeGreaterThan(0);
      count.commits = 0;
      // The follow loop runs ~900ms after mount: glide the cards 1px per frame meanwhile
      await frames(480, () => (shift += 1));
      expect(paths()).not.toEqual(start);
      expect(count.commits).toBeLessThan(480 / FRAME / 4);
    });

    test("no React commits once still", async () => {
      const { count, view } = mount();
      await frames(2000);
      count.commits = 0;
      await frames(2000);
      expect(count.commits).toBe(0);
      view.unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });
}

/* Phase 3: collapsed is controllable both ways, onResolve may be async */
const tree: TreeAgent = {
  id: "lead",
  name: "Lead",
  task: "Plan",
  status: "running",
  children: [
    { id: "w", name: "Writer", task: "Draft", status: "waiting", ask: "Publish?", children: [{ id: "s", name: "Search", task: "Find", status: "done" }] },
  ],
};
for (const [style, ui] of styles) {
  describe(`agent-tree ${style} – contract`, () => {
    test("uncontrolled collapsed folds and reports; controlled only reports", async () => {
      const onCollapsedChange = vi.fn();
      const view = render(<ui.AgentTree root={tree} now={0} onCollapsedChange={onCollapsedChange} />);
      const button = [...view.container.querySelectorAll<HTMLButtonElement>(".ui-agt__fold")].pop()!;
      await act(async () => button.click());
      const [folded] = onCollapsedChange.mock.calls[0];
      expect(folded).toHaveLength(1);
      expect(button.getAttribute("aria-expanded")).toBe("false");
      view.unmount();

      const onControlled = vi.fn();
      const c = render(<ui.AgentTree root={tree} now={0} collapsed={[]} onCollapsedChange={onControlled} />);
      const b2 = [...c.container.querySelectorAll<HTMLButtonElement>(".ui-agt__fold")].pop()!;
      await act(async () => b2.click());
      expect(onControlled).toHaveBeenCalledWith(folded);
      expect(b2.getAttribute("aria-expanded")).toBe("true");
    });

    test("an async answer waits, and a rejection keeps the window open and says so", async () => {
      let fail: (e: Error) => void = () => {};
      const onResolve = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
      const view = render(<ui.AgentTree root={tree} now={0} onResolve={onResolve} />);
      await act(async () => view.getByRole("button", { name: /needs you/ }).click());
      const approve = view.getByRole("button", { name: "Approve" });
      await act(async () => approve.click());
      expect(onResolve).toHaveBeenCalledWith(expect.objectContaining({ id: "w" }), "approve");
      expect(approve).toHaveProperty("disabled", true);
      await act(async () => fail(new Error("offline")));
      expect(view.getByRole("alert").textContent).toMatch(/try again/);
      expect(view.getByRole("button", { name: "Approve" })).toHaveProperty("disabled", false);
    });
  });
}

/* Phase 4: running times tick in the DOM – no re-render per second – and stop while the tab is hidden */
for (const [style, ui] of styles) {
  describe(`agent-tree ${style} – clock`, () => {
    test("the internal clock writes running times without a React commit, and pauses while hidden", async () => {
      const started = Date.now();
      const running: TreeAgent = { id: "r", name: "Runner", task: "Work", status: "running", started };
      const count = { commits: 0 };
      const view = render(
        <Profiler id="tree" onRender={() => count.commits++}>
          <ui.AgentTree root={running} />
        </Profiler>,
      );
      const time = () => view.container.querySelector('[class$="__time"]')!.textContent;
      await frames(500);
      count.commits = 0;
      await frames(3000);
      // Ticked at 1, 2 and 3 seconds
      expect(time()).toBe(" · 3s");
      expect(count.commits).toBe(0);

      const hidden = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
      expect(vi.getTimerCount()).toBe(0);
      hidden.mockReturnValue("visible");
      await frames(2000);
      document.dispatchEvent(new Event("visibilitychange"));
      expect(time()).toBe(" · 6s");
      view.unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });
}

/* WCAG pass: plain nested lists instead of a tree role without its keyboard pattern (4.1.2), the card's keyboard
   target is a real button (no interactive nested in interactive), a narrow status region (4.1.3), focus kept on
   Esc, on answering and on folding (2.4.3), leaving cards inert */
const flush = () => act(async () => {});
for (const [style, ui] of styles) {
  describe(`agent-tree ${style} – a11y`, () => {
    test("nested lists, no tree roles, fold names contain their visible text", () => {
      const view = render(<ui.AgentTree root={tree} now={0} />);
      expect(view.container.querySelector('[role="tree"], [role="treeitem"], [role="group"]')).toBeNull();
      const outer = view.getByRole("list", { name: "Agents" });
      const items = view.getAllByRole("listitem");
      expect(items.length).toBe(3);
      expect(outer.contains(view.getByRole("list", { name: "Started by Writer" }))).toBe(true);
      // No aria-label overrides a card's content
      for (const li of items) expect(li.hasAttribute("aria-label")).toBe(false);
      const fold = view.getByRole("button", { name: "1 sub-agents of Writer" });
      expect(fold.getAttribute("aria-expanded")).toBe("true");
    });

    test("onSelect: the name is a button, the card itself is not focusable and holds no nested control", () => {
      const onSelect = vi.fn();
      const view = render(<ui.AgentTree root={tree} now={0} onSelect={onSelect} />);
      const name = view.getByRole("button", { name: "Writer" });
      act(() => name.click());
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "w" }));
      for (const node of view.container.querySelectorAll('[class$="__node"]')) {
        expect(node.hasAttribute("tabindex")).toBe(false);
        expect(node.getAttribute("role")).toBeNull();
      }
    });

    test("the run summary is not a live region; a narrow status is there from mount", () => {
      const view = render(<ui.AgentTree root={tree} now={0} />);
      expect(view.container.querySelector("[aria-live]")).toBeNull();
      const status = view.getByRole("status");
      expect(status.textContent).toBe("1 agent needs you");
      expect(status.textContent).not.toMatch(/\$/);
    });

    test("Esc in the window returns focus to the button that opened it", async () => {
      const view = render(<ui.AgentTree root={tree} now={0} onResolve={() => {}} />);
      const trigger = view.getByRole("button", { name: /needs you/ });
      await act(async () => trigger.click());
      const approve = view.getByRole("button", { name: "Approve" });
      approve.focus();
      await act(async () => {
        approve.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      });
      expect(view.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    test("answering the last one closes the window without dropping focus to <body>", async () => {
      const view = render(<ui.AgentTree root={tree} now={0} onResolve={() => {}} />);
      const trigger = view.getByRole("button", { name: /needs you/ });
      await act(async () => trigger.click());
      const approve = view.getByRole("button", { name: "Approve" });
      approve.focus();
      await act(async () => approve.click());
      await flush();
      expect(view.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    test("folding a branch that holds focus moves it to the branch's fold button; leaving cards are inert", async () => {
      const deep: TreeAgent = { ...tree, children: [{ ...tree.children![0], children: [{ id: "s", name: "Search", task: "Find", status: "done", children: [{ id: "x", name: "Fetch", task: "Get", status: "done" }] }] }] };
      const view = render(<ui.AgentTree root={deep} now={0} collapsed={[]} />);
      const inner = view.getByRole("button", { name: "1 sub-agents of Search" });
      inner.focus();
      view.rerender(<ui.AgentTree root={deep} now={0} collapsed={["w"]} />);
      await flush();
      const leaving = view.container.querySelectorAll('[class$="__node"][data-leaving]');
      expect(leaving.length).toBeGreaterThan(0);
      for (const node of leaving) expect(node.hasAttribute("inert")).toBe(true);
      expect(document.activeElement).toBe(view.getByRole("button", { name: "+2 sub-agents of Writer" }));
    });
  });
}

/* Performance pass: the connector follow loop doesn't run while the tree is off screen */
for (const [style, ui] of styles) {
  describe(`agent-tree ${style} – off screen`, () => {
    test("no animation frames while off screen; one measure on return", async () => {
      let report: (hit: boolean) => void = () => {};
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(cb: (e: { isIntersecting: boolean }[]) => void) {
            report = (hit) => cb([{ isIntersecting: hit }]);
          }
          observe() {}
          disconnect() {}
        },
      );
      const view = render(<ui.AgentTree root={ROOT} now={0} />);
      await frames(1500);
      await act(async () => report(false));
      const raf = vi.spyOn(window, "requestAnimationFrame");
      view.rerender(<ui.AgentTree root={{ ...ROOT, children: [...ROOT.children!, { id: "c", name: "Docs", task: "Write", status: "running" }] }} now={0} />);
      await frames(200);
      expect(raf).not.toHaveBeenCalled();
      expect(view.container.querySelector("[data-offscreen]")).not.toBeNull();
      await act(async () => report(true));
      expect(view.container.querySelector("[data-offscreen]")).toBeNull();
      vi.unstubAllGlobals();
    });
  });
}

test("agent-tree: queued and stopped cards fade their marks, not their text", () => {
  render(<standard.AgentTree root={ROOT} now={0} />);
  const css = document.querySelector('style[data-href="ui-agent-tree"]')!.textContent!;
  expect(css).not.toMatch(/\.ui-agt__node\[data-status="queued"\][^{]*\{ opacity/);
  expect(css).toMatch(/:is\(\.ui-agt__avatar, \.ui-agt__tools\) \{ opacity/);
});
