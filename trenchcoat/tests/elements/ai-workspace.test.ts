/*
 * <tc-ai-workspace> in real browsers: structure in both looks, sending and the typed answer, a failed answer with Try
 * again, menus and their keyboard, the sidebar, projects (search, sort, rename, pin, create), the dialog's focus,
 * events and preventDefault, narrow width, the React wrapper and axe in both looks and both themes. Ports the jsdom
 * regressions of the React block (tests/regressions/blocks-ai-workspace.test.tsx).
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/ai-workspace";
import type { AiWorkspaceConversation, AiWorkspaceConversationsChange, AiWorkspaceProjectsChange, TcAiWorkspace } from "../../src/elements/ai-workspace";
import { AiWorkspace } from "../../src/elements/react/ai-workspace";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const make = (look: "standard" | "clean" = "standard", respond?: (m: string) => Promise<string>, width = 960) =>
  fixture<HTMLDivElement>(html`<div style=${`width: ${width}px`}><tc-ai-workspace look=${look} .respond=${respond}></tc-ai-workspace></div>`).then(
    (wrap) => wrap.querySelector<TcAiWorkspace>("tc-ai-workspace")!,
  );
const name = (b: Element) => (b.getAttribute("aria-label") ?? b.textContent ?? "").replace(/\s+/g, " ").trim();
const button = (el: Element, n: string | RegExp) =>
  [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => (typeof n === "string" ? name(b) === n : n.test(name(b))))!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const answerText = (el: Element) => el.querySelector(".ui-aw__msg--ai:last-of-type .ui-aw__ai-body p")?.textContent ?? "";

describe("tc-ai-workspace", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: sidebar, bar and the welcome with composer and starters`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("aw");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-aw__side")!.getAttribute("aria-label")).toBe("Workspace");
      expect(el.querySelector(".ui-aw__ws")!.textContent).toBe("N");
      expect(button(el, "New chat").getAttribute("aria-current")).toBe("true");
      expect([...el.querySelectorAll(".ui-aw__recents .ui-aw__item")].map((b) => b.textContent!.trim())).toEqual([
        "Summarize interview notes",
        "Draft launch email",
        "Rewrite onboarding copy",
        "Plan sprint goals",
      ]);
      expect(el.querySelector(".ui-aw__hello")!.textContent).toBe("Hello Lena");
      expect(el.querySelector(".ui-aw__welcome tc-chat-composer")).not.toBeNull();
      expect(el.querySelectorAll(".ui-aw__starter")).toHaveLength(3);
      expect(el.querySelector(".ui-aw__main > [role='status']")!.textContent).toBe("");
    });
  }

  test("a starter starts a chat: focus to the reply box, Thinking… then the answer types in and is announced once", async () => {
    let done!: (s: string) => void;
    const el = await make("standard", () => new Promise((r) => (done = r)));
    const changes: AiWorkspaceConversation[][] = [];
    el.addEventListener("tc-conversations-change", (e) => changes.push((e as CustomEvent<AiWorkspaceConversationsChange>).detail.conversations));
    const starter = button(el, "Compare our pricing tiers");
    starter.focus();
    starter.click();
    await settle(el);
    expect(el.querySelector(".ui-aw__thinking")!.textContent).toBe("Thinking…");
    expect(el.querySelector(".ui-aw__main > [role='status']")!.textContent).toBe("Thinking…");
    expect(document.activeElement).toBe(el.querySelector(".ui-aw__composer--dock textarea"));
    expect(changes[0]).toHaveLength(5);
    expect(changes[0][0].title).toBe("Compare our pricing tiers");
    const answer = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
    done(answer);
    await expect.poll(() => answerText(el).length).toBeGreaterThan(0);
    expect(answerText(el).length).toBeLessThan(answer.length);
    await expect.poll(() => answerText(el), { timeout: 5000 }).toBe(answer);
    expect(el.querySelector(".ui-aw__main > [role='status']")!.textContent).toBe(answer);
    expect(el.querySelector(".ui-aw__messages")!.hasAttribute("aria-live")).toBe(false);
    expect(changes.at(-1)![0].messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    await expect.poll(() => button(el, "Copy answer")).toBeTruthy();
  });

  test("a rejected answer shows an error with Try again, which recovers", async () => {
    let calls = 0;
    const el = await make("standard", async () => {
      calls++;
      if (calls === 1) throw new Error("Model is busy");
      return "Keep three tiers.";
    });
    button(el, "Compare our pricing tiers").click();
    await expect.poll(() => el.querySelector("[role='alert']")?.textContent ?? "").toContain("Model is busy");
    expect(el.querySelector(".ui-aw__thinking")).toBeNull();
    button(el, "Try again").click();
    await expect.poll(() => el.querySelector("[role='alert']")).toBeNull();
    await expect.poll(() => answerText(el), { timeout: 5000 }).toBe("Keep three tiers.");
  });

  test("a prevented tc-conversations-change keeps the list (controlled use)", async () => {
    const el = await make("standard", async () => "Hi");
    el.addEventListener("tc-conversations-change", (e) => e.preventDefault());
    button(el, "Compare our pricing tiers").click();
    await settle(el);
    expect(el.conversations).toHaveLength(4);
  });

  test("a menu takes focus, arrows move, choosing returns focus to its trigger", async () => {
    const el = await make();
    const trigger = button(el, /Brand Refresh/);
    trigger.click();
    await settle(el);
    const items = [...el.querySelectorAll<HTMLElement>("[role='menuitemradio']")];
    expect(document.activeElement).toBe(items[0]);
    key(items[0], "ArrowDown");
    expect(document.activeElement).toBe(items[1]);
    key(items[1], "End");
    expect(document.activeElement).toBe(items[items.length - 1]);
    items[1].click();
    await settle(el);
    expect(el.querySelector("[role='menu']")).toBeNull();
    expect(document.activeElement).toBe(button(el, /Customer Research/));
  });

  test("Esc closes a menu and focus goes back to the trigger; Delete chat removes the open chat", async () => {
    const el = await make();
    button(el, "Plan sprint goals").click();
    await settle(el);
    const more = button(el, "More");
    more.click();
    await settle(el);
    expect(document.activeElement).toBe(button(el, "Share chat"));
    key(document.activeElement!, "Escape");
    await settle(el);
    expect(el.querySelector("[role='menu']")).toBeNull();
    expect(document.activeElement).toBe(more);
    more.click();
    await settle(el);
    button(el, "Delete chat").click();
    await settle(el);
    expect(el.conversations.map((c) => c.title)).not.toContain("Plan sprint goals");
    expect(el.querySelector(".ui-aw__welcome")).not.toBeNull();
  });

  test("collapsing and opening the sidebar keeps focus on the toggle's counterpart", async () => {
    const el = await make();
    button(el, "Collapse sidebar").click();
    await settle(el);
    expect(el.hasAttribute("data-collapsed")).toBe(true);
    expect(el.querySelector<HTMLElement>(".ui-aw__side")!.inert).toBe(true);
    expect(document.activeElement).toBe(button(el, "Open sidebar"));
    button(el, "Open sidebar").click();
    await settle(el);
    expect(document.activeElement).toBe(button(el, "Collapse sidebar"));
  });

  test("the dialog takes focus, keeps Tab inside and returns focus to Create project; creating reports the list", async () => {
    const el = await make();
    const lists: number[] = [];
    el.addEventListener("tc-projects-change", (e) => lists.push((e as CustomEvent<AiWorkspaceProjectsChange>).detail.projects.length));
    button(el, "Projects").click();
    await settle(el);
    const create = button(el, "Create project");
    create.focus();
    create.click();
    await settle(el);
    const field = el.querySelector<HTMLInputElement>(".ui-aw__field")!;
    expect(document.activeElement).toBe(field);
    const cancel = button(el, "Cancel");
    key(field, "Tab", { shiftKey: true });
    expect(document.activeElement).toBe(cancel);
    key(cancel, "Tab");
    expect(document.activeElement).toBe(field);
    cancel.click();
    await settle(el);
    expect(document.activeElement).toBe(create);
    create.click();
    await settle(el);
    field.value = "Launch Plan";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await settle(el);
    key(field, "Enter");
    await settle(el);
    expect(lists).toEqual([7]);
    expect(el.querySelector(".ui-aw__project-name")!.textContent).toBe("Launch Plan");
  });

  test("renaming with Enter keeps the name and returns focus to the card's options; Pin moves it to the sidebar", async () => {
    const el = await make();
    button(el, "Projects").click();
    await settle(el);
    button(el, "Pricing Page options").click();
    await settle(el);
    button(el, "Rename").click();
    await settle(el);
    const input = el.querySelector<HTMLInputElement>(".ui-aw__rename")!;
    expect(document.activeElement).toBe(input);
    input.value = "Plans";
    key(input, "Enter");
    await settle(el);
    expect(document.activeElement).toBe(button(el, "Plans options"));
    button(el, "Plans options").click();
    await settle(el);
    button(el, "Pin").click();
    await settle(el);
    expect([...el.querySelectorAll(".ui-aw__side .ui-aw__item")].map((b) => b.textContent!.trim())).toContain("Plans");
  });

  test("search filters chats and projects; sort by name", async () => {
    const el = await make();
    const search = el.querySelector<HTMLInputElement>(".ui-aw__side input")!;
    search.value = "email";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await settle(el);
    expect([...el.querySelectorAll(".ui-aw__recents .ui-aw__item")].map((b) => b.textContent!.trim())).toEqual(["Draft launch email"]);
    search.value = "zzz";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await settle(el);
    expect(el.querySelector(".ui-aw__recents .ui-aw__none")!.textContent).toBe("No chats match.");
    button(el, "Projects").click();
    await settle(el);
    button(el, /Sort by/).click();
    await settle(el);
    button(el, "Name").click();
    await settle(el);
    expect([...el.querySelectorAll(".ui-aw__project-name")].map((n) => n.textContent)[0]).toBe("Brand Refresh");
    expect([...el.querySelectorAll(".ui-aw__project-name")].map((n) => n.textContent)[1]).toBe("Customer Research");
    expect([...el.querySelectorAll(".ui-aw__project-name")].map((n) => n.textContent).at(-1)).toBe("Q4 Planning");
  });

  test("an unsafe avatar URL shows the initial instead", async () => {
    const el = await make();
    el.userAvatar = "javascript:alert(1)";
    await settle(el);
    expect(el.querySelector(".ui-aw__user img")).toBeNull();
    expect(el.querySelector(".ui-aw__user-dot")!.textContent).toBe("L");
  });

  test("two workspaces don't share the dialog's id", async () => {
    const wrap = await fixture(html`<div><tc-ai-workspace></tc-ai-workspace><tc-ai-workspace></tc-ai-workspace></div>`);
    const ids = [...wrap.querySelectorAll("[role='dialog']")].map((d) => d.getAttribute("aria-labelledby"));
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(wrap.querySelector(`[id="${id}"]`)!.textContent).toBe("Create project");
  });

  test("narrow: the sidebar starts closed, opens as an overlay", async () => {
    const el = await make("standard", undefined, 375);
    expect(el.hasAttribute("data-collapsed")).toBe(true);
    button(el, "Open sidebar").click();
    await settle(el);
    expect(getComputedStyle(el.querySelector(".ui-aw__side")!).position).toBe("absolute");
  });
});

describe("AiWorkspace (React)", () => {
  test("controlled conversations follow the prop and changes are reported", async () => {
    const host = document.createElement("div");
    host.style.width = "960px";
    document.body.append(host);
    const root = createRoot(host);
    const reported: number[] = [];
    const one = [{ id: "a", title: "Alpha", messages: [] }];
    const render = (list: AiWorkspaceConversation[]) =>
      root.render(React.createElement(AiWorkspace, { conversations: list, onConversationsChange: (next: AiWorkspaceConversation[]) => reported.push(next.length), respond: async () => "Hi" }));
    await act(async () => render(one));
    const el = host.querySelector("tc-ai-workspace")!;
    await settle(el);
    await act(async () => button(el, "Compare our pricing tiers").click());
    expect(reported[0]).toBe(2);
    // Controlled: the element keeps the prop's list until the parent passes another
    expect(el.conversations).toBe(one);
    await act(async () => render([{ id: "b", title: "Beta", messages: [] }]));
    await settle(el);
    expect(el.textContent).toContain("Beta");
    expect(el.textContent).not.toContain("Alpha");
    await act(async () => root.unmount());
  });

  test("uncontrolled projects survive parent re-renders", async () => {
    const host = document.createElement("div");
    host.style.width = "960px";
    document.body.append(host);
    const root = createRoot(host);
    let rerender = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(AiWorkspace, {});
    }
    await act(async () => root.render(React.createElement(App)));
    const el = host.querySelector("tc-ai-workspace")!;
    await settle(el);
    button(el, "Projects").click();
    await settle(el);
    button(el, "Help Center options").click();
    await settle(el);
    await act(async () => button(el, "Pin").click());
    await act(async () => rerender());
    await settle(el);
    expect(el.projects.find((p) => p.name === "Help Center")!.pinned).toBe(true);
    await act(async () => root.unmount());
  });
});

describe("tc-ai-workspace – axe", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, welcome and projects`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="width: 960px; padding: 16px; background: var(--tc-surface-base)">
        <tc-ai-workspace look="standard"></tc-ai-workspace>
        <tc-ai-workspace look="clean"></tc-ai-workspace>
      </div>`);
      const [, clean] = wrap.querySelectorAll("tc-ai-workspace");
      button(clean, "Projects").click();
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

/* blocks/ai-workspace is a thin shell over the element: it keeps the React block's props and types and forwards them
   (it replaced tests/regressions/blocks-ai-workspace.test.tsx, whose behaviour checks moved up this file) */
describe("blocks/ai-workspace", () => {
  test("forwards the block's props and ref; a workspace that isn't text leaves the tile empty", async () => {
    const { AiWorkspace: Block } = await import("@blocks/ai-workspace");
    const host = document.createElement("div");
    host.style.width = "960px";
    document.body.append(host);
    const root = createRoot(host);
    const ref = React.createRef<HTMLDivElement>();
    await act(async () => root.render(React.createElement(Block, { ref, className: "mine", userName: "Ada", workspace: "A", defaultProjects: [] })));
    const el = host.querySelector<TcAiWorkspace>("tc-ai-workspace")!;
    await settle(el);
    expect(ref.current).toBe(el);
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.querySelector(".ui-aw__hello")!.textContent).toBe("Hello Ada");
    expect(el.querySelector(".ui-aw__ws")!.textContent).toBe("A");
    expect(el.projects).toEqual([]);
    await act(async () => root.render(React.createElement(Block, { workspace: React.createElement("img", { alt: "" }) })));
    await settle(el);
    expect(el.querySelector(".ui-aw__ws")!.textContent).toBe("");
    await act(async () => root.unmount());
  });
});
