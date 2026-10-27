/*
 * <tc-context-map> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/context-map";
import type { ContextAgentChange, ContextBlock, ContextViewChange, TcContextMap } from "../../src/elements/context-map";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const BLOCKS: ContextBlock[] = [
  { id: "sys", label: "System prompt", kind: "system", tokens: 3200 },
  { id: "tools", label: "Tools", kind: "tools", tokens: 14800, detail: "7 tool definitions" },
  { id: "f1", label: "checkout.ts", kind: "file", tokens: 18400 },
];
const AGENTS = [
  { id: "a", name: "Checkout fixer", limit: 200000 },
  { id: "b", name: "Docs writer", limit: 500000 },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Lets the tiles glide to their sizes */
const tiles = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="listitem"]')];
const allTiles = () => [...document.querySelectorAll<HTMLElement>('tc-context-map [role="listitem"]')];
/** Waits at least `ms`, then until no tile on the page has moved for 200 ms (a loaded machine runs the glide slower) */
const glide = async (ms = 1200) => {
  await wait(ms);
  const snap = () => allTiles().map((t) => t.getAttribute("style")).join("|");
  for (let last = snap(), i = 0; i < 40; i++) {
    await wait(200);
    const now = snap();
    if (now === last) break;
    last = now;
  }
  await settle();
};
const hits = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-cxm__hit")];
const geometry = (el: Element) => tiles(el).map((t) => ["--x", "--y", "--w", "--h"].map((p) => t.style.getPropertyValue(p)).join(" "));
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const mapAt = (look: string, blocks: ContextBlock[]) => html`<tc-context-map look=${look} style="width:640px" .blocks=${blocks} limit="200000"></tc-context-map>`;

describe("tc-context-map", () => {
  test("the host is the root; the bar, the area and its name", async () => {
    const el = await fixture<TcContextMap>(html`<tc-context-map model="Sonnet 5" .blocks=${BLOCKS} limit="200000"></tc-context-map>`);
    await glide();
    expect(el.dataset.ui).toBe("cxm");
    expect(el.dataset.look).toBe("standard");
    const area = el.querySelector('[role="list"]')!;
    expect(document.getElementById(area.getAttribute("aria-labelledby")!)!.textContent).toBe("Context");
    expect(el.querySelector(".ui-cxm__model")!.textContent).toBe("Sonnet 5");
    expect(el.querySelector(".ui-cxm__pct")!.textContent).toBe("18%");
    expect(tiles(el)).toHaveLength(4);
    expect(tiles(el).at(-1)!.getAttribute("aria-label")).toBe("Free – 164k tokens");
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("the motion stops once the tiles have settled; nothing runs after removal", async () => {
        const el = await fixture<TcContextMap>(mapAt(look, BLOCKS));
        await glide(1500);
        // A slow runner may still be easing after 1.5 s: measure from where it has actually settled
        await expect.poll(() => el["raf"], { timeout: 5000 }).toBe(0);
        const before = geometry(el);
        let updates = 0;
        const update = el["update"].bind(el);
        (el as unknown as { update: (c: unknown) => void }).update = (c) => {
          updates++;
          update(c as never);
        };
        await wait(500);
        expect(updates).toBe(0);
        expect(geometry(el)).toEqual(before);
        expect(el["raf"]).toBe(0);
        el.blocks = [...BLOCKS, { id: "f2", label: "payment-intent.ts", kind: "file", tokens: 42_000 }];
        await wait(50);
        el.remove();
        expect(el["raf"]).toBe(0);
      });

      test("the same blocks again don't restart the motion", async () => {
        const el = await fixture<TcContextMap>(mapAt(look, BLOCKS));
        await glide(1500);
        el.blocks = BLOCKS.map((b) => ({ ...b }));
        await settle();
        expect(el["raf"]).toBe(0);
      });

      test("growing tiles glide without a render per frame, and end where a fresh map puts them", async () => {
        const el = await fixture<TcContextMap>(mapAt(look, BLOCKS));
        await glide(1500);
        const grown = [...BLOCKS, { id: "f2", label: "payment-intent.ts", kind: "file" as const, tokens: 42_000 }];
        el.blocks = grown;
        await settle();
        const before = geometry(el);
        let updates = 0;
        const update = el["update"].bind(el);
        (el as unknown as { update: (c: unknown) => void }).update = (c) => {
          updates++;
          update(c as never);
        };
        await glide(1500);
        expect(updates).toBeLessThan(1500 / 16 / 4);
        // Compare where each has actually come to rest – a slow runner may still be easing after 1.5 s
        await expect.poll(() => el["raf"], { timeout: 5000 }).toBe(0);
        const settled = geometry(el);
        expect(settled).not.toEqual(before);
        const fresh = await fixture<TcContextMap>(mapAt(look, grown));
        await glide(1500);
        await expect.poll(() => fresh["raf"], { timeout: 5000 }).toBe(0);
        expect(geometry(fresh)).toEqual(settled);
        expect(hits(el).map((t) => t.getAttribute("aria-label"))).toContain("payment-intent.ts, File – 42k tokens");
      });

      test("a removed block shrinks away and leaves the map", async () => {
        const el = await fixture<TcContextMap>(mapAt(look, BLOCKS));
        await glide();
        el.blocks = BLOCKS.slice(0, 2);
        await glide(1500);
        expect(hits(el).map((t) => t.getAttribute("aria-label"))).toEqual(["System prompt, System prompt – 3.2k tokens", "Tools, Tools – 14.8k tokens"]);
      });

      test("agent: changes on its own and reports; preventDefault keeps control (contract)", async () => {
        const el = await fixture<TcContextMap>(html`<tc-context-map look=${look} .blocks=${BLOCKS} limit="200000" .agents=${AGENTS}></tc-context-map>`);
        const got: string[] = [];
        el.addEventListener("tc-agent-change", (e) => got.push((e as CustomEvent<ContextAgentChange>).detail.agent));
        const name = () => el.querySelector(".ui-cxm__agent .ui-cxm__model")!.textContent;
        const pick = async () => {
          el.querySelector<HTMLButtonElement>(".ui-cxm__agent")!.click();
          await settle();
          [...el.querySelectorAll<HTMLButtonElement>(".ui-cxm__option")].find((o) => o.textContent!.includes("Docs writer"))!.click();
          await settle();
        };
        await pick();
        expect(got).toEqual(["b"]);
        expect(name()).toBe("Docs writer");
        expect(el.querySelector(".ui-cxm__agent .ui-cxm__limit")!.textContent).toBe("500k");
        el.agent = "a";
        await settle();
        expect(name()).toBe("Checkout fixer");
        el.addEventListener("tc-agent-change", (e) => e.preventDefault());
        await pick();
        expect(got).toEqual(["b", "b"]);
        expect(name()).toBe("Checkout fixer");
      });

      test("view: switches and reports; a new compaction shows After again unless prevented (contract)", async () => {
        const el = await fixture<TcContextMap>(html`<tc-context-map look=${look} .blocks=${BLOCKS} limit="200000" view="before" .compaction=${{ before: BLOCKS }}></tc-context-map>`);
        const pressed = () => el.querySelector('.ui-cxm__compare [aria-pressed="true"]')!.textContent;
        expect(pressed()).toBe("Before");
        const got: ContextViewChange[] = [];
        el.addEventListener("tc-view-change", (e) => got.push((e as CustomEvent<ContextViewChange>).detail));
        el.compaction = { before: BLOCKS };
        await settle();
        expect(pressed()).toBe("After");
        expect(got).toEqual([{ view: "after", reset: true }]);
        [...el.querySelectorAll<HTMLButtonElement>(".ui-cxm__compare button")][0].click();
        await settle();
        expect(pressed()).toBe("Before");
        expect(got.at(-1)).toEqual({ view: "before" });
        el.addEventListener("tc-view-change", (e) => e.preventDefault());
        el.compaction = { before: BLOCKS };
        await settle();
        expect(pressed()).toBe("Before");
      });

      test("every block is a named button with one tab stop; arrow keys move between them; a click pins and selects", async () => {
        const el = await fixture<TcContextMap>(mapAt(look, BLOCKS));
        const selected: (ContextBlock | null)[] = [];
        el.addEventListener("tc-select", (e) => selected.push((e as CustomEvent<ContextBlock | null>).detail));
        await glide();
        const b = hits(el);
        expect(b.map((x) => x.getAttribute("aria-label"))).toEqual(["System prompt, System prompt – 3.2k tokens", "Tools, Tools – 14.8k tokens", "checkout.ts, File – 18.4k tokens"]);
        expect(b.map((x) => x.tabIndex)).toEqual([0, -1, -1]);
        b[0].focus();
        key(b[0], "ArrowRight");
        await settle();
        expect(document.activeElement).toBe(hits(el)[1]);
        key(document.activeElement!, "End");
        await settle();
        expect(document.activeElement).toBe(hits(el)[2]);
        expect(hits(el).map((x) => x.tabIndex)).toEqual([-1, -1, 0]);
        hits(el)[2].click();
        await settle();
        expect(selected.at(-1)).toEqual(expect.objectContaining({ id: "f1" }));
        expect(hits(el)[2].getAttribute("aria-pressed")).toBe("true");
        tiles(el).at(-1)!.click();
        expect(selected.at(-1)).toBeNull();
      });

      test("focus shows the card (described by it), Escape hides it without moving focus", async () => {
        const el = await fixture<TcContextMap>(mapAt(look, BLOCKS));
        await glide();
        const tools = hits(el)[1];
        tools.focus();
        await settle();
        const tip = el.querySelector<HTMLElement>('[role="tooltip"]')!;
        expect(tip.textContent).toContain("Tools");
        expect(tip.textContent).toContain("7 tool definitions");
        expect(tools.getAttribute("aria-describedby")).toBe(tip.id);
        key(document.body, "Escape");
        await settle();
        expect(el.querySelector('[role="tooltip"]')).toBeNull();
        expect(document.activeElement).toBe(tools);
      });

      test("before a compaction, the block's fate is in its name; the line under the map adds it up", async () => {
        const compaction = { before: BLOCKS, summarized: ["f1"], dropped: ["tools"] };
        const el = await fixture<TcContextMap>(html`<tc-context-map look=${look} style="width:640px" .blocks=${BLOCKS} limit="200000" .compaction=${compaction} view="before"></tc-context-map>`);
        await glide();
        expect(hits(el).map((x) => x.getAttribute("aria-label"))).toEqual([
          "System prompt, System prompt – 3.2k tokens, kept",
          "Tools, Tools – 14.8k tokens, dropped",
          "checkout.ts, File – 18.4k tokens, summarized",
        ]);
        expect(el.querySelector(".ui-cxm__fates")!.textContent!.replace(/\s+/g, " ")).toContain("1 kept · 3.2k");
        const none = await fixture<TcContextMap>(html`<tc-context-map look=${look} .blocks=${BLOCKS} limit="200000" .compaction=${null}></tc-context-map>`);
        expect(none.querySelector(".ui-cxm__fates--none")).toBeTruthy();
      });

      test("agent menu: focus moves in, arrows move, picking returns focus to the button, Escape too", async () => {
        const el = await fixture<TcContextMap>(html`<tc-context-map look=${look} .blocks=${BLOCKS} limit="200000" .agents=${AGENTS}></tc-context-map>`);
        const trigger = el.querySelector<HTMLButtonElement>(".ui-cxm__agent")!;
        trigger.focus();
        key(trigger, "ArrowDown");
        await settle();
        const items = () => [...el.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
        expect(trigger.getAttribute("aria-expanded")).toBe("true");
        expect(document.activeElement).toBe(items()[0]);
        key(document.activeElement!, "ArrowDown");
        expect(document.activeElement).toBe(items()[1]);
        key(document.activeElement!, "ArrowDown");
        expect(document.activeElement).toBe(items()[0]);
        key(document.activeElement!, "Escape");
        await settle();
        expect(el.querySelector('[role="menu"]')).toBeNull();
        expect(document.activeElement).toBe(trigger);
        // Click opens on the checked item; picking closes and focus is back on the button, not <body>
        trigger.click();
        await settle();
        expect(document.activeElement).toBe(items()[0]);
        items()[1].click();
        await settle();
        expect(el.querySelector('[role="menu"]')).toBeNull();
        expect(document.activeElement).toBe(trigger);
        expect(trigger.textContent).toContain("Docs writer");
      });

      test("the status is announced through a region that's there from the start", async () => {
        const el = await fixture<TcContextMap>(mapAt(look, BLOCKS));
        const region = el.querySelector('[role="status"]');
        expect(region).not.toBeNull();
        expect(region!.textContent).toBe("");
        el.status = "Compacting";
        await settle();
        expect(el.querySelector('[role="status"]')).toBe(region);
        expect(region!.textContent).toBe("Compacting");
        expect(el.querySelector(".ui-cxm__status")!.textContent).toContain("Compacting");
      });
    });
  }

  test("icons are cloned from elements", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("data-mine", "");
    const el = await fixture<TcContextMap>(html`<tc-context-map style="width:640px" model="M" .modelIcon=${icon} .blocks=${[{ ...BLOCKS[2], icon }]} limit="40000"></tc-context-map>`);
    await glide();
    expect(el.querySelectorAll("svg[data-mine]").length).toBeGreaterThanOrEqual(2);
    expect(icon.isConnected).toBe(false);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div style="width:680px">
      <tc-context-map model="Sonnet 5" .blocks=${BLOCKS} limit="200000" .compaction=${{ before: BLOCKS, summarized: ["f1"] }}></tc-context-map>
      <tc-context-map look="clean" heading="Clean" .agents=${AGENTS} .blocks=${BLOCKS} limit="200000" status="Compacting"></tc-context-map>
    </div>`);
    await glide();
    document.getAnimations().forEach((a) => a.effect?.getComputedTiming().endTime !== Infinity && a.finish());
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

