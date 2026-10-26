/*
 * <tc-blur-crossfade> in real browsers – the React component's contract and regression checks, ported. A swap is
 * what a framework does: replace the child layer, then set swapKey.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/blur-crossfade";
import type { TcBlurCrossfade } from "../../src/elements/blur-crossfade";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const layer = (inner: string) => {
  const d = document.createElement("div");
  d.className = "ui-bx__layer";
  d.innerHTML = inner;
  return d;
};
const swap = async (el: TcBlurCrossfade, key: string, inner: string) => {
  const next = layer(inner);
  el.querySelector(":scope > :not(.ui-bx__layer--out)")!.remove();
  el.append(next);
  el.swapKey = key;
  await settle(el.parentElement!);
  return next;
};
const outgoing = (el: Element) => el.querySelector(".ui-bx__layer--out")?.textContent;
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

describe("tc-blur-crossfade", () => {
  test("the host is the root; attributes stay on it; the swap key isn't the id", async () => {
    const el = await fixture<TcBlurCrossfade>(html`<tc-blur-crossfade swap-key="a" title="status" data-x="1" blur="6"><div>one</div></tc-blur-crossfade>`);
    expect(el.dataset.ui).toBe("bx");
    expect(el.getAttribute("title")).toBe("status");
    expect(el.getAttribute("data-x")).toBe("1");
    expect(el.hasAttribute("id")).toBe(false);
    expect(el.getAttribute("morph")).toBe("height");
    expect(el.style.getPropertyValue("--tc-blur-crossfade-blur")).toBe("6px");
  });

  test("content updated under the same key is what leaves on the next swap; the copy goes after the swap", async () => {
    const el = await fixture<TcBlurCrossfade>(html`<tc-blur-crossfade swap-key="a" duration="100"><div class="ui-bx__layer">first</div></tc-blur-crossfade>`);
    el.querySelector(".ui-bx__layer")!.textContent = "first, updated";
    await swap(el, "b", "second");
    if (!reducedMotion()) {
      expect(outgoing(el)).toBe("first, updated");
      const out = el.querySelector(".ui-bx__layer--out")!;
      expect(out.getAttribute("aria-hidden")).toBe("true");
      expect(out.hasAttribute("inert")).toBe(true);
      expect(el.hasAttribute("data-busy")).toBe(true);
    }
    await new Promise((r) => setTimeout(r, 200));
    await settle();
    expect(outgoing(el)).toBeUndefined();
    expect(el.hasAttribute("data-busy")).toBe(false);
    expect(el.style.height).toBe("");
  });

  test("re-rendering with the same key doesn't swap", async () => {
    const el = await fixture<TcBlurCrossfade>(html`<tc-blur-crossfade swap-key="a"><div>one</div></tc-blur-crossfade>`);
    el.swapKey = "a";
    el.duration = 300;
    await settle();
    expect(outgoing(el)).toBeUndefined();
    expect(el.hasAttribute("data-busy")).toBe(false);
  });

  test("height glides from the old size to the new", async () => {
    if (reducedMotion()) return;
    const el = await fixture<TcBlurCrossfade>(html`<tc-blur-crossfade swap-key="a" duration="300"><div style="height: 40px">one</div></tc-blur-crossfade>`);
    await swap(el, "b", '<div style="height: 120px">two</div>');
    expect(el.style.height).toBe("120px");
    expect(el.style.transition).toMatch(/height 300ms/);
    expect(el.getBoundingClientRect().height).toBeLessThan(120);
  });

  test("focus on a control in the old content moves to the new content's first control, not to <body> (2.4.3)", async () => {
    const el = await fixture<TcBlurCrossfade>(html`<tc-blur-crossfade swap-key="a"><div><button type="button">Retry</button></div></tc-blur-crossfade>`);
    el.querySelector("button")!.focus();
    await swap(el, "b", '<p>Done</p><button type="button">Undo</button>');
    expect(document.activeElement!.textContent).toBe("Undo");
  });

  test("with no control in the new content, the new content itself takes focus", async () => {
    const el = await fixture<TcBlurCrossfade>(html`<tc-blur-crossfade swap-key="a"><div><button type="button">Save</button></div></tc-blur-crossfade>`);
    el.querySelector("button")!.focus();
    const next = await swap(el, "b", "Saved");
    expect(document.activeElement).toBe(next);
    expect(next.getAttribute("tabindex")).toBe("-1");
  });

  test("a swap doesn't take focus when it wasn't inside", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div><button id="outside">Out</button><tc-blur-crossfade swap-key="a"><div><button>One</button></div></tc-blur-crossfade></div>`);
    const outside = wrap.querySelector<HTMLButtonElement>("#outside")!;
    outside.focus();
    await swap(wrap.querySelector("tc-blur-crossfade")!, "b", "<button>Two</button>");
    expect(document.activeElement).toBe(outside);
  });

  test("morph both centres the layers in an inline box", async () => {
    const el = await fixture<TcBlurCrossfade>(html`<tc-blur-crossfade morph="both" swap-key="a"><div style="width: 200px">one</div></tc-blur-crossfade>`);
    expect(getComputedStyle(el).display).toBe("inline-block");
    expect(el.getBoundingClientRect().width).toBe(200);
  });

  test("removed mid-swap, it leaves no timer behind and resets the box", async () => {
    const el = await fixture<TcBlurCrossfade>(html`<tc-blur-crossfade swap-key="a" duration="300"><div>one</div></tc-blur-crossfade>`);
    await swap(el, "b", "two");
    el.remove();
    expect(el.hasAttribute("data-busy")).toBe(false);
    expect(el.style.height).toBe("");
  });

  test("axe: no violations mid-swap (contrast aside: the new text is fading in) and after it", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div><tc-blur-crossfade swap-key="a" duration="150"><div><strong>Saved</strong><button>Undo</button></div></tc-blur-crossfade></div>`);
    await swap(wrap.querySelector("tc-blur-crossfade")!, "b", "<strong>Uploading</strong><button>Cancel</button>");
    const run = async (rules?: Record<string, { enabled: boolean }>) => {
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, rules, resultTypes: ["violations"] });
      return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    };
    expect(await run({ "color-contrast": { enabled: false } })).toEqual([]);
    await new Promise((r) => setTimeout(r, 300));
    await settle();
    expect(await run()).toEqual([]);
  });
});
