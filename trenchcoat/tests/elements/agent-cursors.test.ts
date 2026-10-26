/*
 * <tc-agent-cursors> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/agent-cursors";
import { acceptSuggestion, type AgentFollowingChange, type AgentTabChange, type DocComment, type DocSuggestion, type TcAgentCursors } from "../../src/elements/agent-cursors";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const agents = [{ id: "ada", name: "Ada" }];
const blocks = [
  { id: "p1", text: "First paragraph" },
  { id: "p2", text: "Second paragraph" },
];
const comments: DocComment[] = [
  { id: "c1", agent: "ada", block: "p1", text: "Shorter?" },
  { id: "c2", agent: "ada", block: "p2", text: "Source?" },
];
const tabs = [
  { id: "doc", label: "Document" },
  { id: "table", label: "Table" },
];
const sugBlocks = [
  { id: "p1", text: "The quick fox jumps" },
  { id: "p2", text: "Over the lazy dog" },
];
const sugs: DocSuggestion[] = [
  { id: "s1", agent: "ada", block: "p1", at: 4, remove: 5, insert: "swift", note: "Shorter" },
  { id: "s2", agent: "ada", block: "p2", at: 0, insert: "Right " },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const replies = (el: Element) => [...el.querySelectorAll<HTMLInputElement>('input[placeholder="Reply"]')];
const typeInto = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
};
const byName = (el: Element, role: string, name: string | RegExp) =>
  [...el.querySelectorAll<HTMLElement>(role === "button" ? 'button, [role="button"]' : `[role="${role}"]`)].find((b) => {
    const n = b.getAttribute("aria-label") ?? b.textContent!.trim();
    return typeof name === "string" ? n === name : name.test(n);
  })!;
const selected = (el: Element) => [...el.querySelectorAll('[role="tab"]')].find((t) => t.getAttribute("aria-selected") === "true")?.textContent!.trim();

describe("tc-agent-cursors", () => {
  test("the host is the root; header, faces and pointers placed from the page", async () => {
    const el = await fixture<TcAgentCursors>(html`<tc-agent-cursors heading="Brief" style="width:600px" .agents=${[...agents, { id: "bo", name: "Bo", cost: 0.5 }]} .blocks=${blocks} .cursors=${{ ada: { block: "p1", at: 3, doing: "Reading" } }}></tc-agent-cursors>`);
    await wait(100);
    await settle();
    expect(el.dataset.ui).toBe("agc");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(".ui-agc__title")!.textContent).toBe("Brief");
    expect(el.querySelector(".ui-agc__sum")!.textContent).toContain("1 here");
    expect(el.querySelector(".ui-agc__spent")!.textContent).toBe("$0.50");
    const pointer = el.querySelector<HTMLElement>('.ui-agc__cursor[data-agent="ada"]')!;
    expect(pointer.style.transform).toMatch(/^translate\(/);
    expect(pointer.querySelector(".ui-agc__flag-doing")!.textContent).toBe("Reading");
    expect(byName(el, "button", /^Follow Ada – Reading$/)).toBeTruthy();
    expect(byName(el, "button", /^Follow Bo \(not in the document\)$/)).toBeTruthy();
  });

  test("acceptSuggestion writes the change and moves later suggestions along", () => {
    const out = acceptSuggestion(sugBlocks, [...sugs, { id: "s3", agent: "ada", block: "p1", at: 15, insert: "!" }], "s1");
    expect(out.blocks[0].text).toBe("The swift fox jumps");
    expect(out.suggestions.map((s) => [s.id, s.at])).toEqual([
      ["s2", 0],
      ["s3", 15],
    ]);
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("every comment pin keeps its own reply draft", async () => {
        const onReply = vi.fn();
        const el = await fixture<TcAgentCursors>(html`<tc-agent-cursors look=${look} .agents=${agents} .blocks=${blocks} .comments=${comments} .cursors=${{}} .onReply=${onReply}></tc-agent-cursors>`);
        await wait(50);
        await settle();
        const [first, second] = replies(el);
        typeInto(first, "Will do");
        typeInto(second, "Added a link");
        await settle();
        expect(first.value).toBe("Will do");
        expect(second.value).toBe("Added a link");
        key(second, "Enter");
        await settle();
        expect(onReply).toHaveBeenCalledWith(comments[1], "Added a link");
        expect(second.value).toBe("");
        expect(first.value).toBe("Will do");
      });

      test("tab: starts at the given one, switches on click and reports; preventDefault keeps it (contract)", async () => {
        const el = await fixture<TcAgentCursors>(html`<tc-agent-cursors look=${look} .agents=${agents} .blocks=${blocks} .cursors=${{}} .tabs=${tabs} tab="table"></tc-agent-cursors>`);
        const got: string[] = [];
        el.addEventListener("tc-tab-change", (e) => got.push((e as CustomEvent<AgentTabChange>).detail.tab));
        expect(selected(el)).toBe("Table");
        byName(el, "tab", "Document").click();
        await settle();
        expect(selected(el)).toBe("Document");
        expect(got).toEqual(["doc"]);
        el.addEventListener("tc-tab-change", (e) => e.preventDefault());
        byName(el, "tab", "Table").click();
        await settle();
        expect(got).toEqual(["doc", "table"]);
        expect(selected(el)).toBe("Document");
      });

      test("following: a face follows its agent; preventDefault keeps control (contract)", async () => {
        const el = await fixture<TcAgentCursors>(html`<tc-agent-cursors look=${look} .agents=${[...agents, { id: "bo", name: "Bo" }]} .blocks=${blocks} .cursors=${{ ada: { block: "p1", at: 0 }, bo: { block: "p1", at: 2 } }}></tc-agent-cursors>`);
        const got: (string | null)[] = [];
        el.addEventListener("tc-following-change", (e) => got.push((e as CustomEvent<AgentFollowingChange>).detail.following));
        byName(el, "button", /^Follow Ada/).click();
        await settle();
        expect(el.getAttribute("data-following")).toBe("ada");
        expect(byName(el, "button", /^Stop following Ada/).getAttribute("aria-pressed")).toBe("true");
        el.following = "bo";
        await settle();
        expect(el.getAttribute("data-following")).toBe("bo");
        el.addEventListener("tc-following-change", (e) => e.preventDefault());
        byName(el, "button", /^Stop following Bo/).click();
        await settle();
        expect(got).toEqual(["ada", null]);
        expect(el.getAttribute("data-following")).toBe("bo");
      });

      test("a reply that fails comes back so it can be sent again", async () => {
        let fail: (e: Error) => void = () => {};
        const onReply = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
        const el = await fixture<TcAgentCursors>(html`<tc-agent-cursors look=${look} .agents=${agents} .blocks=${blocks} .comments=${comments} .cursors=${{}} .onReply=${onReply}></tc-agent-cursors>`);
        await wait(50);
        await settle();
        const [first] = replies(el);
        typeInto(first, "Will do");
        key(first, "Enter");
        await settle();
        expect(first.getAttribute("aria-busy")).toBe("true");
        key(first, "Enter");
        expect(onReply).toHaveBeenCalledTimes(1);
        fail(new Error("offline"));
        await wait(0);
        await settle();
        expect(first.value).toBe("Will do");
        expect(first.getAttribute("aria-invalid")).toBe("true");
      });

      test("Enter while composing (IME) does not send", async () => {
        const onReply = vi.fn();
        const el = await fixture<TcAgentCursors>(html`<tc-agent-cursors look=${look} .agents=${agents} .blocks=${blocks} .comments=${comments} .cursors=${{}} .onReply=${onReply}></tc-agent-cursors>`);
        await wait(50);
        await settle();
        const [first] = replies(el);
        typeInto(first, "かな");
        key(first, "Enter", { isComposing: true });
        expect(onReply).not.toHaveBeenCalled();
      });

      const doc = async (accepted: string[] = []) => {
        const wrap = await fixture(html`<div>
          <tc-agent-cursors look=${look} can-accept can-reject .agents=${agents} .blocks=${sugBlocks} .suggestions=${sugs} .cursors=${{}}></tc-agent-cursors>
          <button type="button">After</button>
        </div>`);
        const el = wrap.querySelector<TcAgentCursors>("tc-agent-cursors")!;
        const drop = (e: Event) => {
          const s = (e as CustomEvent<DocSuggestion>).detail;
          accepted.push(s.id);
          el.suggestions = el.suggestions.filter((x) => x.id !== s.id);
        };
        el.addEventListener("tc-accept", drop);
        el.addEventListener("tc-reject", drop);
        await settle();
        return el;
      };

      test("suggestions are named buttons that open their window; Enter moves focus in, Esc comes back", async () => {
        const el = await doc();
        const ins = byName(el, "button", "Ada suggests adding: swift");
        expect(ins.tagName).toBe("INS");
        expect(byName(el, "button", "Ada suggests removing: quick").tagName).toBe("DEL");
        ins.focus();
        await settle();
        // Focus shows the preview without taking focus away
        expect(byName(el, "dialog", "Suggestion from Ada")).toBeTruthy();
        expect(document.activeElement).toBe(ins);
        key(ins, "Enter");
        await settle();
        expect(document.activeElement).toBe(byName(el, "button", "Reject"));
        key(document.activeElement!, "Escape");
        await settle();
        expect(el.querySelector('[role="dialog"]')).toBeNull();
        expect(document.activeElement).toBe(ins);
      });

      test("Tab past the window goes on from the suggestion, not to the end of the page", async () => {
        const el = await doc();
        const ins = byName(el, "button", "Ada suggests adding: swift");
        ins.focus();
        key(ins, " ");
        await settle();
        const accept = byName(el, "button", "Accept");
        accept.focus();
        key(accept, "Tab");
        await settle();
        expect(document.activeElement).toBe(byName(el, "button", "Ada suggests adding: Right "));
      });

      test("Accept keeps focus in the document: on the next suggestion once this one is gone", async () => {
        const accepted: string[] = [];
        const el = await doc(accepted);
        const ins = byName(el, "button", "Ada suggests adding: swift");
        ins.focus();
        key(ins, "Enter");
        await settle();
        byName(el, "button", "Accept").click();
        await settle();
        await settle();
        expect(accepted).toEqual(["s1"]);
        expect(document.activeElement).not.toBe(document.body);
        expect(document.activeElement?.getAttribute("data-sug")).toBe("s2");
      });

      test("tabs follow the tabs pattern: roving tabindex, arrows, a labelled panel", async () => {
        const el = await fixture<TcAgentCursors>(html`<tc-agent-cursors look=${look} .agents=${agents} .blocks=${blocks} .cursors=${{}} .tabs=${tabs}></tc-agent-cursors>`);
        const [d, t] = [...el.querySelectorAll<HTMLElement>('[role="tab"]')];
        expect(d.tabIndex).toBe(0);
        expect(t.tabIndex).toBe(-1);
        d.focus();
        key(d, "ArrowRight");
        await settle();
        expect(document.activeElement).toBe(t);
        expect(t.getAttribute("aria-selected")).toBe("true");
        const panel = el.querySelector('[role="tabpanel"]')!;
        expect(panel.getAttribute("aria-labelledby")).toBe(t.id);
        expect(t.getAttribute("aria-controls")).toBe(panel.id);
        key(t, "Home");
        await settle();
        expect(document.activeElement).toBe(d);
      });

      test("a closed comment is inert; Esc inside an open one closes it and returns focus to its pin", async () => {
        const el = await fixture<TcAgentCursors>(html`<tc-agent-cursors look=${look} .agents=${agents} .blocks=${blocks} .comments=${[comments[0]]} .cursors=${{}} .onReply=${() => {}}></tc-agent-cursors>`);
        await wait(50);
        await settle();
        const reply = replies(el)[0];
        expect(reply.closest("[inert]")).not.toBeNull();
        const pin = byName(el, "button", "Comment from Ada: Shorter?");
        pin.focus();
        await settle();
        expect(pin.getAttribute("aria-expanded")).toBe("true");
        expect(reply.closest("[inert]")).toBeNull();
        reply.focus();
        key(reply, "Escape");
        await settle();
        expect(document.activeElement).toBe(pin);
        expect(pin.getAttribute("aria-expanded")).toBe("false");
        expect(reply.closest("[inert]")).not.toBeNull();
        // A press on the pin opens it again
        pin.click();
        await settle();
        expect(pin.getAttribute("aria-expanded")).toBe("true");
      });

      test("Esc closes a pin opened by hover without moving focus", async () => {
        const wrap = await fixture(html`<div>
          <button type="button">Elsewhere</button>
          <tc-agent-cursors look=${look} .agents=${agents} .blocks=${blocks} .comments=${[comments[0]]} .cursors=${{}}></tc-agent-cursors>
        </div>`);
        await wait(50);
        await settle();
        const elsewhere = wrap.querySelector("button")!;
        elsewhere.focus();
        const pin = byName(wrap, "button", "Comment from Ada: Shorter?");
        pin.closest(".ui-agc__pin")!.dispatchEvent(new MouseEvent("mouseenter"));
        await settle();
        expect(pin.getAttribute("aria-expanded")).toBe("true");
        key(document.body, "Escape");
        await settle();
        expect(pin.getAttribute("aria-expanded")).toBe("false");
        expect(document.activeElement).toBe(elsewhere);
      });

      test("Esc hides the faces' hover tips; the live region is there from the start and announces", async () => {
        const el = await fixture<TcAgentCursors>(html`<tc-agent-cursors look=${look} .agents=${agents} .blocks=${blocks} .cursors=${{ ada: { block: "p1", at: 0 } }}></tc-agent-cursors>`);
        const live = el.querySelector('[role="status"]')!;
        expect(live).toBeTruthy();
        key(document.body, "Escape");
        await settle();
        expect(el.hasAttribute("data-hush")).toBe(true);
        byName(el, "button", /Follow Ada/).focus();
        await settle();
        expect(el.hasAttribute("data-hush")).toBe(false);
        el.suggestions = [sugs[0]];
        await settle();
        expect(live.textContent).toBe("Ada suggests a change: Shorter");
      });

      test("Accept all and resolve fire their events", async () => {
        const el = await fixture<TcAgentCursors>(html`<tc-agent-cursors look=${look} can-accept-all can-resolve .agents=${agents} .blocks=${sugBlocks} .suggestions=${sugs} .comments=${[comments[0]]} .cursors=${{}}></tc-agent-cursors>`);
        await wait(50);
        await settle();
        const all = vi.fn();
        const resolved: DocComment[] = [];
        el.addEventListener("tc-accept-all", all);
        el.addEventListener("tc-resolve", (e) => resolved.push((e as CustomEvent<DocComment>).detail));
        byName(el, "button", "Accept all").click();
        expect(all).toHaveBeenCalledTimes(1);
        byName(el, "button", "Comment from Ada: Shorter?").click();
        await settle();
        byName(el, "button", "Resolve").click();
        expect(resolved).toEqual([comments[0]]);
        el.suggestions = [];
        await settle();
        expect(el.querySelector<HTMLButtonElement>(".ui-agc__all")!.disabled).toBe(true);
      });
    });
  }

  test("a selection lights up behind the text; an image held by an agent shows its frame", async () => {
    const el = await fixture<TcAgentCursors>(html`<tc-agent-cursors style="width:600px" .agents=${[{ id: "ada", name: "Ada", color: "#f97316" }]} .blocks=${[...blocks, { id: "img", kind: "image", width: 0.5, loading: true }]} .cursors=${{ ada: { block: "p1", at: 0, select: 5 } }}></tc-agent-cursors>`);
    await wait(100);
    await settle();
    expect(el.querySelectorAll(".ui-agc__mark").length).toBe(1);
    el.cursors = { ada: { block: "img", select: 1, point: "corner" } };
    await wait(50);
    await settle();
    expect(el.querySelectorAll(".ui-agc__handle").length).toBe(4);
    expect(el.querySelector('.ui-agc__cursor[data-agent="ada"]')!.hasAttribute("data-drag")).toBe(true);
  });

  test("removing it leaves no timers or frames", async () => {
    const el = await fixture<TcAgentCursors>(html`<tc-agent-cursors .agents=${agents} .blocks=${sugBlocks} .suggestions=${sugs} .cursors=${{ ada: { block: "p1", at: 0 } }}></tc-agent-cursors>`);
    byName(el, "button", "Ada suggests adding: swift").dispatchEvent(new MouseEvent("mouseleave"));
    el.remove();
    expect(el["raf"]).toBe(0);
    expect(el["arriveTimer"]).toBe(0);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div style="width:680px">
      <tc-agent-cursors heading="Brief" can-accept can-reject .tabs=${tabs} .agents=${[{ id: "ada", name: "Ada", color: "#c2410c" }]} .blocks=${sugBlocks} .suggestions=${sugs} .comments=${[comments[0]]} .cursors=${{ ada: { block: "p1", at: 3 } }} .onReply=${() => {}}></tc-agent-cursors>
      <tc-agent-cursors look="clean" heading="Clean" .agents=${agents} .blocks=${blocks} .comments=${[comments[1]]} .cursors=${{ ada: { block: "p2", at: 1, doing: "Typing" } }}></tc-agent-cursors>
    </div>`);
    await wait(200);
    await settle();
    document.getAnimations().forEach((a) => a.effect?.getComputedTiming().endTime !== Infinity && a.finish());
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
