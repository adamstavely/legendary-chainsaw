/*
 * <tc-agent-tree> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/agent-tree";
import type { TcAgentTree, TreeAgent } from "../../src/elements/agent-tree";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
/** Counts the element's renders from now on */
const renders = (el: TcAgentTree) => vi.spyOn(el as unknown as { render: () => unknown }, "render");

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
const tree: TreeAgent = {
  id: "lead",
  name: "Lead",
  task: "Plan",
  status: "running",
  children: [{ id: "w", name: "Writer", task: "Draft", status: "waiting", ask: "Publish?", children: [{ id: "s", name: "Search", task: "Find", status: "done" }] }],
};
const byText = (el: Element, selector: string, text: string | RegExp) =>
  [...el.querySelectorAll<HTMLElement>(selector)].find((b) => (typeof text === "string" ? b.textContent!.trim() === text || b.getAttribute("aria-label") === text : text.test(b.textContent!) || text.test(b.getAttribute("aria-label") ?? "")))!;

describe("tc-agent-tree", () => {
  test("the host is the root; wide trees lay the first level side by side", async () => {
    const el = await fixture<TcAgentTree>(html`<tc-agent-tree style="width: 800px" .root=${ROOT} now="0"></tc-agent-tree>`);
    await settle();
    expect(el.dataset.ui).toBe("agt");
    expect(el.dataset.look).toBe("standard");
    expect(el.hasAttribute("data-wide")).toBe(true);
    el.style.width = "400px";
    await wait(50);
    await settle();
    expect(el.hasAttribute("data-wide")).toBe(false);
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("connectors are drawn and follow a moving card without a render per frame", async () => {
        const el = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} style="width: 800px" .root=${ROOT} now="0"></tc-agent-tree>`);
        await wait(100);
        const paths = () => [...el.querySelectorAll(".ui-agt__links:not(.ui-agt__dots) path")].map((p) => p.getAttribute("d"));
        const start = paths();
        expect(start.length).toBeGreaterThan(0);
        expect(el.querySelectorAll(".ui-agt__dots circle").length).toBeGreaterThan(0);
        const count = renders(el);
        // The follow loop runs ~900ms after mount: move a card 1px per frame meanwhile
        const card = el.querySelector<HTMLElement>('.ui-agt__node[data-id="b"]')!;
        for (let i = 1; i <= 20; i++) {
          card.style.translate = `${i}px 0`;
          await frame();
        }
        expect(paths()).not.toEqual(start);
        expect(count.mock.calls.length).toBeLessThan(5);
      });

      test("no renders once still", async () => {
        const el = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} .root=${ROOT} now="0"></tc-agent-tree>`);
        await wait(1600);
        const count = renders(el);
        await wait(600);
        expect(count).not.toHaveBeenCalled();
      });

      test("uncontrolled collapsed folds and fires; prevented, it only fires", async () => {
        const seen: string[][] = [];
        const el = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} .root=${tree} now="0" @tc-collapsed-change=${(e: CustomEvent<{ collapsed: string[] }>) => seen.push(e.detail.collapsed)}></tc-agent-tree>`);
        const button = [...el.querySelectorAll<HTMLButtonElement>(".ui-agt__fold")].pop()!;
        button.click();
        await settle();
        expect(seen).toEqual([["w"]]);
        expect(button.getAttribute("aria-expanded")).toBe("false");
        expect(button.getAttribute("aria-label")).toBe("+1 sub-agents of Writer");

        const c = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} .root=${tree} now="0" .collapsed=${[]} @tc-collapsed-change=${(e: Event) => e.preventDefault()}></tc-agent-tree>`);
        const b2 = [...c.querySelectorAll<HTMLButtonElement>(".ui-agt__fold")].pop()!;
        b2.click();
        await settle();
        expect(b2.getAttribute("aria-expanded")).toBe("true");
        c.collapsed = ["w"];
        await settle();
        expect(b2.getAttribute("aria-expanded")).toBe("false");
      });

      test("an async answer waits, and a rejection keeps the window open and says so", async () => {
        let fail: (e: Error) => void = () => {};
        const resolver = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
        const fired: string[] = [];
        const el = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} .root=${tree} now="0" .resolver=${resolver} @tc-resolve=${(e: CustomEvent<{ action: string }>) => fired.push(e.detail.action)}></tc-agent-tree>`);
        byText(el, ".ui-agt__sum-btn", /needs you/).click();
        await settle();
        const approve = byText(el, ".ui-agt__btn", "Approve") as HTMLButtonElement;
        approve.click();
        await settle();
        expect(resolver).toHaveBeenCalledWith(expect.objectContaining({ id: "w" }), "approve");
        expect(fired).toEqual(["approve"]);
        expect(approve.disabled).toBe(true);
        fail(new Error("offline"));
        await settle();
        expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/try again/);
        expect((byText(el, ".ui-agt__btn", "Approve") as HTMLButtonElement).disabled).toBe(false);
      });

      test("the internal clock writes running times without a render, and pauses while hidden", async () => {
        vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
        const running: TreeAgent = { id: "r", name: "Runner", task: "Work", status: "running", started: Date.now() };
        const el = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} .root=${running}></tc-agent-tree>`);
        const time = () => el.querySelector(".ui-agt__time")!.textContent;
        const count = renders(el);
        vi.advanceTimersByTime(3000);
        expect(time()).toBe(" · 3s");
        expect(count).not.toHaveBeenCalled();
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
        document.dispatchEvent(new Event("visibilitychange"));
        expect(vi.getTimerCount()).toBe(0);
        delete (document as { visibilityState?: unknown }).visibilityState;
        vi.advanceTimersByTime(3000);
        document.dispatchEvent(new Event("visibilitychange"));
        expect(time()).toBe(" · 6s");
        el.remove();
        expect(vi.getTimerCount()).toBe(0);
      });

      /* WCAG pass */
      test("nested lists, no tree roles, fold names contain their visible text", async () => {
        const el = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} .root=${tree} now="0"></tc-agent-tree>`);
        expect(el.querySelector('[role="tree"], [role="treeitem"], [role="group"]')).toBeNull();
        const outer = el.querySelector('[role="list"][aria-label="Agents"]')!;
        const items = el.querySelectorAll('[role="listitem"]');
        expect(items.length).toBe(3);
        expect(outer.contains(el.querySelector('[role="list"][aria-label="Started by Writer"]'))).toBe(true);
        for (const li of items) expect(li.hasAttribute("aria-label")).toBe(false);
        const fold = byText(el, ".ui-agt__fold", "1 sub-agents of Writer");
        expect(fold.textContent!.trim()).toBe("1");
        expect(fold.getAttribute("aria-expanded")).toBe("true");
      });

      test("selectable: the name is a button firing tc-select; the card is not focusable and holds no nested control", async () => {
        const picked: string[] = [];
        const el = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} .root=${tree} now="0" selectable @tc-select=${(e: CustomEvent<{ agent: TreeAgent }>) => picked.push(e.detail.agent.id)}></tc-agent-tree>`);
        byText(el, ".ui-agt__select", "Writer").click();
        expect(picked).toEqual(["w"]);
        el.querySelector<HTMLElement>('.ui-agt__node[data-id="s"] .ui-agt__task')!.click();
        expect(picked).toEqual(["w", "s"]);
        for (const node of el.querySelectorAll(".ui-agt__node")) {
          expect(node.hasAttribute("tabindex")).toBe(false);
          expect(node.getAttribute("role")).toBeNull();
        }
      });

      test("the run summary is not a live region; a narrow status is there from the start", async () => {
        const el = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} .root=${tree} now="0"></tc-agent-tree>`);
        expect(el.querySelector("[aria-live]")).toBeNull();
        const status = el.querySelector('[role="status"]')!;
        expect(status.textContent).toBe("1 agent needs you");
      });

      test("Esc in the window returns focus to the button that opened it", async () => {
        const el = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} .root=${tree} now="0"></tc-agent-tree>`);
        const trigger = byText(el, ".ui-agt__sum-btn", /needs you/);
        trigger.click();
        await settle();
        const approve = byText(el, ".ui-agt__btn", "Approve");
        expect(document.activeElement).toBe(approve);
        approve.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        await settle();
        expect(el.querySelector('[role="dialog"]')).toBeNull();
        expect(document.activeElement).toBe(trigger);
      });

      test("answering the last one closes the window without dropping focus to <body>", async () => {
        const el = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} .root=${tree} now="0"></tc-agent-tree>`);
        const trigger = byText(el, ".ui-agt__sum-btn", /needs you/);
        trigger.click();
        await settle();
        const approve = byText(el, ".ui-agt__btn", "Approve");
        approve.focus();
        approve.click();
        await settle();
        await wait(0);
        expect(el.querySelector('[role="dialog"]')).toBeNull();
        expect(document.activeElement).toBe(trigger);
      });

      test("a click elsewhere closes the window", async () => {
        const el = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} .root=${tree} now="0"></tc-agent-tree>`);
        byText(el, ".ui-agt__sum-btn", /needs you/).click();
        await settle();
        expect(el.querySelector('[role="dialog"]')).not.toBeNull();
        document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
        await settle();
        expect(el.querySelector('[role="dialog"]')).toBeNull();
      });

      test("folding a branch that holds focus moves it to the branch's fold button; leaving cards are inert", async () => {
        const deep: TreeAgent = { ...tree, children: [{ ...tree.children![0], children: [{ id: "s", name: "Search", task: "Find", status: "done", children: [{ id: "x", name: "Fetch", task: "Get", status: "done" }] }] }] };
        const el = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} .root=${deep} now="0" .collapsed=${[]}></tc-agent-tree>`);
        byText(el, ".ui-agt__fold", "1 sub-agents of Search").focus();
        el.collapsed = ["w"];
        await settle();
        await wait(0);
        const leaving = el.querySelectorAll(".ui-agt__node[data-leaving]");
        expect(leaving.length).toBeGreaterThan(0);
        for (const node of leaving) expect((node as HTMLElement).inert).toBe(true);
        expect(document.activeElement).toBe(byText(el, ".ui-agt__fold", "+2 sub-agents of Writer"));
      });

      test("avatars and tool marks are cloned into the cards", async () => {
        const mark = (name: string) => {
          const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          s.setAttribute("data-mark", name);
          return s;
        };
        const agent: TreeAgent = { id: "r", name: "Runner", task: "Work", status: "done", avatar: mark("logo"), tools: [mark("gh"), mark("gh")] };
        const el = await fixture<TcAgentTree>(html`<tc-agent-tree look=${look} .root=${agent} now="0"></tc-agent-tree>`);
        expect(el.querySelector('.ui-agt__avatar[data-logo] svg[data-mark="logo"]')).toBeTruthy();
        expect(el.querySelectorAll('.ui-agt__tool svg[data-mark="gh"]')).toHaveLength(2);
        expect(agent.avatar!.isConnected).toBe(false);
      });
    });
  }

  test("off screen: the connectors stop following and the tree is marked; back on screen it catches up", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="padding-top: 0"><tc-agent-tree .root=${ROOT} now="0"></tc-agent-tree></div>`);
    const el = wrap.querySelector("tc-agent-tree")!;
    await wait(1500);
    wrap.style.paddingTop = "5000px";
    await wait(100);
    await settle();
    expect(el.querySelector(".ui-agt__tree")!.hasAttribute("data-offscreen")).toBe(true);
    el.root = { ...ROOT, children: [...ROOT.children!, { id: "c", name: "Docs", task: "Write", status: "running" }] };
    await settle();
    expect((el as unknown as { raf: number }).raf).toBe(0);
    wrap.style.paddingTop = "0";
    await wait(100);
    await settle();
    expect(el.querySelector(".ui-agt__tree")!.hasAttribute("data-offscreen")).toBe(false);
  });

  test("queued and stopped cards fade their marks, not their text", async () => {
    await fixture(html`<tc-agent-tree .root=${ROOT} now="0"></tc-agent-tree>`);
    const css = (customElements.get("tc-agent-tree") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.ui-agt__node\[data-status="queued"\][^{]*\{ opacity/);
    expect(css).toMatch(/:is\(\.ui-agt__avatar, \.ui-agt__tools\) \{ opacity/);
  });

  test("timers stop when the element leaves the page", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    const el = await fixture<TcAgentTree>(html`<tc-agent-tree .root=${{ ...tree, started: 1 }}></tc-agent-tree>`);
    el.collapsed = ["w"];
    await el.updateComplete;
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-agent-tree .root=${tree} now="0" selectable></tc-agent-tree>
      <tc-agent-tree look="clean" heading="Clean run" .root=${ROOT} now="0"></tc-agent-tree>
    </div>`);
    await wait(1200);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
