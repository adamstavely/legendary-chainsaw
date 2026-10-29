/*
 * internal/popover.ts in real browsers: the placement maths (side, flip, shift, arrow, off-screen), and the controller
 * – the top layer (not clipped by an overflow or transformed ancestor), fixed placement at --tc-z-popover as the
 * fallback (also inside a transformed ancestor), roles, Escape with focus return, outside pointer-down, stacking,
 * clean-up, hover intent and the Tab bridge.
 */
import { html, LitElement, nothing } from "lit";
import { afterEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTabbable, placePopover, PopoverController, type PopoverCloseReason, type PopoverKind, type PopoverOptions, type PopoverRect } from "../../src/elements/internal/popover";
import { cleanup } from "./helpers";

afterEach(cleanup);

const VP = { width: 800, height: 600 };
const rect = (left: number, top: number, width = 100, height = 20): PopoverRect => ({ left, top, width, height });
const SIZE = { width: 200, height: 40 };

describe("placePopover", () => {
  test("above the anchor by default, centred, with the gap", () => {
    const p = placePopover(rect(300, 300), SIZE, VP);
    expect(p).toMatchObject({ side: "top", flipped: false, left: 250, top: 252, shift: 0, arrowX: 100, offscreen: false });
  });

  test("flips below when there's no room above, and back when asked for bottom with no room below", () => {
    expect(placePopover(rect(300, 20), SIZE, VP)).toMatchObject({ side: "bottom", flipped: true, top: 48 });
    expect(placePopover(rect(300, 560), SIZE, VP, { side: "bottom" })).toMatchObject({ side: "top", flipped: true, top: 512 });
  });

  test("neither side fits: the roomier one, kept inside the viewport", () => {
    // 64 px free above, 84 below: below wins, pulled up to stay inside
    const p = placePopover(rect(300, 80, 100, 420), { width: 200, height: 150 }, VP);
    expect(p.side).toBe("bottom");
    expect(p.top).toBe(600 - 8 - 150);
    const tall = placePopover(rect(300, 300), { width: 200, height: 900 }, VP);
    expect(tall.top).toBe(8);
  });

  test("shifts sideways at the edges; the arrow still points at the anchor", () => {
    const left = placePopover(rect(0, 300, 40), SIZE, VP);
    expect(left.left).toBe(8);
    expect(left.shift).toBe(8 - (20 - 100));
    expect(left.arrowX).toBe(12);
    const right = placePopover(rect(780, 300, 20), SIZE, VP);
    expect(right.left).toBe(800 - 8 - 200);
    expect(right.arrowX).toBe(198);
    expect(placePopover(rect(300, 300), { width: 900, height: 40 }, VP).left).toBe(8);
  });

  test("start and end alignment, custom gap and margin", () => {
    expect(placePopover(rect(300, 300), SIZE, VP, { align: "start", gap: 4 })).toMatchObject({ left: 300, top: 256 });
    expect(placePopover(rect(300, 300), SIZE, VP, { align: "end" }).left).toBe(200);
    expect(placePopover(rect(2, 300), SIZE, VP, { align: "start", margin: 16 }).left).toBe(16);
  });

  test("an anchor scrolled out of view is reported", () => {
    expect(placePopover(rect(300, -100), SIZE, VP).offscreen).toBe(true);
    expect(placePopover(rect(300, 700), SIZE, VP).offscreen).toBe(true);
    expect(placePopover(rect(300, -10), SIZE, VP).offscreen).toBe(false);
  });
});

/* ---------- The controller, in a host ---------- */

/** Extra options for the next host made */
let extra: Partial<PopoverOptions> = {};

class PopHost extends LitElement {
  static properties = { kind: {} };
  declare kind: PopoverKind;
  closed: PopoverCloseReason[] = [];
  pop = new PopoverController(this, {
    popover: () => this.querySelector(".pop"),
    anchor: () => this.querySelector(".anchor"),
    kind: "toolbar",
    onClose: (r) => this.closed.push(r),
    ...extra,
  });
  constructor() {
    super();
    this.kind = "toolbar";
  }
  protected createRenderRoot() {
    return this;
  }
  render() {
    return html`<button class="anchor" style="margin:200px 0 0 120px">Anchor</button>
      ${this.pop.open ? html`<div class="tc-pop pop" aria-label="Actions"><button class="one">One</button><button class="two">Two</button></div>` : nothing}`;
  }
}
customElements.define("tc-test-pop-host", PopHost);

const host = async (options: Partial<PopoverOptions> = {}, parent: Element = document.body) => {
  extra = options;
  const el = document.createElement("tc-test-pop-host") as PopHost;
  extra = {};
  parent.append(el);
  await el.updateComplete;
  return el;
};
const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1.5);
/** The popover's box once its entry animation (a small slide and scale) has finished */
const box = async (el: Element) => {
  const pop = el.querySelector<HTMLElement>(".pop")!;
  await Promise.all(pop.getAnimations().map((a) => a.finished));
  return pop.getBoundingClientRect();
};

describe("PopoverController", () => {
  test("opens fixed at --tc-z-popover above its anchor, with the role, side and placed state", async () => {
    const el = await host();
    el.querySelector<HTMLElement>(".anchor")!.focus();
    el.pop.show();
    await el.updateComplete;
    const pop = el.querySelector<HTMLElement>(".pop")!;
    const p = await box(el);
    expect(pop.getAttribute("role")).toBe("toolbar");
    expect(pop.dataset.side).toBe("top");
    expect(pop.hasAttribute("data-placed")).toBe(true);
    const cs = getComputedStyle(pop);
    expect(cs.position).toBe("fixed");
    expect(cs.zIndex).toBe("35");
    const a = el.querySelector(".anchor")!.getBoundingClientRect();
    near(p.bottom, a.top - 8);
    near(p.left + p.width / 2, a.left + a.width / 2);
    // It doesn't take focus
    expect(document.activeElement).toBe(el.querySelector(".anchor"));
  });

  test("outside the top layer: placed correctly inside a transformed ancestor (fixed becomes relative to it)", async () => {
    const outer = document.createElement("div");
    outer.style.cssText = "transform: translate(37px, 53px); margin-top: 20px";
    document.body.append(outer);
    const el = await host({ topLayer: false }, outer);
    expect(el.querySelector(".pop")).toBeNull();
    el.pop.show();
    await el.updateComplete;
    expect(el.querySelector(".pop")!.hasAttribute("popover")).toBe(false);
    const p = await box(el);
    const a = el.querySelector(".anchor")!.getBoundingClientRect();
    near(p.bottom, a.top - 8);
    near(p.left + p.width / 2, a.left + a.width / 2);
  });

  test("Escape closes it and returns focus from inside to where it came from", async () => {
    const el = await host();
    const anchor = el.querySelector<HTMLElement>(".anchor")!;
    anchor.focus();
    el.pop.show({ focus: true });
    await el.updateComplete;
    expect(document.activeElement).toBe(el.querySelector(".one"));
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(el.pop.open).toBe(false);
    expect(el.querySelector(".pop")).toBeNull();
    expect(el.closed).toEqual(["escape"]);
    expect(document.activeElement).toBe(anchor);
  });

  test("an Escape handler that prevents the default keeps it open", async () => {
    const el = await host();
    el.pop.show({ focus: true });
    await el.updateComplete;
    el.querySelector(".one")!.addEventListener("keydown", (e) => (e as KeyboardEvent).key === "Escape" && e.preventDefault());
    await userEvent.keyboard("{Escape}");
    expect(el.pop.open).toBe(true);
  });

  test("a pointer-down outside closes it without moving focus; inside or on the anchor doesn't", async () => {
    const el = await host();
    const other = document.createElement("button");
    other.textContent = "Elsewhere";
    document.body.append(other);
    el.pop.show();
    await el.updateComplete;
    el.querySelector(".two")!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    el.querySelector(".anchor")!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    expect(el.pop.open).toBe(true);
    other.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    expect(el.pop.open).toBe(false);
    expect(el.closed).toEqual(["outside"]);
  });

  test("close() from an action inside returns focus; the newest popover takes Escape first", async () => {
    const a = await host();
    const b = await host();
    a.querySelector<HTMLElement>(".anchor")!.focus();
    a.pop.show();
    b.pop.show();
    await a.updateComplete;
    await b.updateComplete;
    a.querySelector<HTMLElement>(".one")!.focus();
    await userEvent.keyboard("{Escape}");
    expect(b.pop.open).toBe(false);
    expect(a.pop.open).toBe(true);
    a.pop.close();
    await a.updateComplete;
    expect(document.activeElement).toBe(a.querySelector(".anchor"));
    expect(a.closed).toEqual(["api"]);
  });

  test("closing one whose host left the page doesn't take another popover off the stack", async () => {
    const a = await host();
    const b = await host();
    a.pop.show();
    b.pop.show();
    await a.updateComplete;
    await b.updateComplete;
    a.remove();
    a.pop.close();
    await userEvent.keyboard("{Escape}");
    expect(b.pop.open).toBe(false);
    expect(b.closed).toEqual(["escape"]);
  });

  test("follows scrolling, and closes when its anchor goes away", async () => {
    const el = await host();
    const spacer = document.createElement("div");
    spacer.style.height = "3000px";
    document.body.append(spacer);
    el.pop.show();
    await el.updateComplete;
    window.scrollBy(0, 50);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const anchor = el.querySelector(".anchor")!;
    near((await box(el)).bottom, anchor.getBoundingClientRect().top - 8);
    window.scrollTo(0, 0);
    anchor.remove();
    el.pop.reposition();
    expect(el.pop.open).toBe(false);
    expect(el.closed).toEqual(["anchor-gone"]);
  });

  test("its listeners go when the host leaves the page", async () => {
    const el = await host();
    el.pop.show();
    await el.updateComplete;
    el.remove();
    await userEvent.keyboard("{Escape}");
    expect(el.closed).toEqual([]);
  });
});

/* ---------- The top layer ---------- */

describe("PopoverController – the top layer", () => {
  test("shown with the Popover API, so a clipping, transformed, scaled ancestor doesn't cut it off", async () => {
    // A gallery-like stage: scaled, and clipping everything outside its small box
    const stage = document.createElement("div");
    stage.style.cssText = "transform: scale(0.8); transform-origin: 0 0; overflow: hidden; width: 260px; height: 260px; margin: 40px";
    document.body.append(stage);
    const el = await host({ side: "bottom" }, stage);
    el.pop.show();
    await el.updateComplete;
    const pop = el.querySelector<HTMLElement>(".pop")!;
    expect(pop.getAttribute("popover")).toBe("manual");
    expect(pop.matches(":popover-open")).toBe(true);
    const p = await box(el);
    const a = el.querySelector(".anchor")!.getBoundingClientRect();
    // Under the anchor as the page shows it (scaled), at its own full size
    near(p.top, a.bottom + 8);
    near(p.left + p.width / 2, a.left + a.width / 2);
    near(p.width, pop.offsetWidth);
    // Outside the stage's box, and still what's on screen there
    const s = stage.getBoundingClientRect();
    expect(p.bottom > s.bottom || p.right > s.right).toBe(true);
    const hit = document.elementFromPoint(p.right - 4, p.bottom - 4);
    expect(hit && pop.contains(hit)).toBe(true);
  });

  test("a popover kept rendered while closed leaves the top layer when it closes", async () => {
    class Kept extends LitElement {
      pop = new PopoverController(this, { popover: () => this.querySelector(".pop"), anchor: () => this.querySelector(".anchor") });
      protected createRenderRoot() {
        return this;
      }
      render() {
        return html`<button class="anchor">A</button><div class="tc-pop pop" ?hidden=${!this.pop.open}>Card</div>`;
      }
    }
    customElements.define("tc-test-pop-kept", Kept);
    const el = document.createElement("tc-test-pop-kept") as Kept;
    document.body.append(el);
    await el.updateComplete;
    const pop = el.querySelector<HTMLElement>(".pop")!;
    el.pop.show();
    await el.updateComplete;
    expect(pop.matches(":popover-open")).toBe(true);
    el.pop.close();
    await el.updateComplete;
    expect(pop.matches(":popover-open")).toBe(false);
    expect(pop.hasAttribute("data-placed")).toBe(false);
    expect(pop.hidden).toBe(true);
  });
});

/* ---------- Hover intent ---------- */

const pe = (type: string, pointerType = "mouse") => new PointerEvent(type, { pointerType, bubbles: false });

describe("PopoverController – hover intent", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("opens after the delay, closes after the grace period – unless the pointer reaches the popover", async () => {
    const el = await host({ hover: { delay: 300, grace: 200 }, kind: "dialog" });
    vi.useFakeTimers();
    const open = () => el.pop.show();
    el.pop.hoverEnter(pe("pointerenter"), open);
    vi.advanceTimersByTime(250);
    expect(el.pop.open).toBe(false);
    // Leaving before the delay calls it off
    el.pop.hoverLeave(pe("pointerleave"));
    vi.advanceTimersByTime(400);
    expect(el.pop.open).toBe(false);
    el.pop.hoverEnter(pe("pointerenter"), open);
    vi.advanceTimersByTime(300);
    expect(el.pop.open).toBe(true);
    vi.useRealTimers();
    await el.updateComplete;
    vi.useFakeTimers();
    // Off the trigger and into the card within the grace period: it stays, and while hovered
    el.pop.hoverLeave(pe("pointerleave"));
    vi.advanceTimersByTime(150);
    const pop = el.querySelector<HTMLElement>(".pop")!;
    pop.dispatchEvent(pe("pointerenter"));
    vi.advanceTimersByTime(1000);
    expect(el.pop.open).toBe(true);
    // Out of the card: it closes once the grace period is over
    pop.dispatchEvent(pe("pointerleave"));
    vi.advanceTimersByTime(199);
    expect(el.pop.open).toBe(true);
    vi.advanceTimersByTime(1);
    expect(el.pop.open).toBe(false);
  });

  test("a delay function is read each time; already open, another trigger opens at once", async () => {
    let delay = 500;
    const el = await host({ hover: { delay: () => delay } });
    vi.useFakeTimers();
    const opened: string[] = [];
    el.pop.hoverEnter(pe("pointerenter"), () => {
      opened.push("a");
      el.pop.show();
    });
    vi.advanceTimersByTime(499);
    expect(opened).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(opened).toEqual(["a"]);
    delay = 2000;
    el.pop.hoverEnter(pe("pointerenter"), () => opened.push("b"));
    expect(opened).toEqual(["a", "b"]);
  });

  test("pinned, or focus on the trigger, keeps it open; touch is ignored", async () => {
    const el = await host({ hover: {} });
    vi.useFakeTimers();
    el.pop.hoverEnter(pe("pointerenter", "touch"), () => el.pop.show());
    vi.advanceTimersByTime(1000);
    expect(el.pop.open).toBe(false);
    el.pop.show({ pin: true });
    expect(el.pop.pinned).toBe(true);
    el.pop.hoverLeave(pe("pointerleave"));
    vi.advanceTimersByTime(1000);
    expect(el.pop.open).toBe(true);
    el.pop.pinned = false;
    el.querySelector<HTMLElement>(".anchor")!.focus();
    el.pop.hoverLeave(pe("pointerleave"));
    vi.advanceTimersByTime(1000);
    expect(el.pop.open).toBe(true);
    el.querySelector<HTMLElement>(".anchor")!.blur();
    el.pop.hoverLeave(pe("pointerleave"));
    vi.advanceTimersByTime(1000);
    expect(el.pop.open).toBe(false);
    // Closing unpins
    el.pop.show({ pin: true });
    el.pop.close();
    expect(el.pop.pinned).toBe(false);
  });
});

/* ---------- The Tab bridge ---------- */

describe("PopoverController – the Tab bridge", () => {
  const page = async (options: Partial<PopoverOptions> = {}) => {
    const before = document.createElement("button");
    before.textContent = "Before";
    document.body.append(before);
    const el = await host({ kind: "dialog", tabBridge: true, ...options });
    const after = document.createElement("button");
    after.textContent = "After";
    document.body.append(after);
    return { el, before, after, anchor: el.querySelector<HTMLElement>(".anchor")! };
  };

  test("Tab from the trigger goes into the open popover, through it, and on to the trigger's next tabbable", async () => {
    const { el, after, anchor } = await page();
    anchor.focus();
    el.pop.show();
    await el.updateComplete;
    // Its buttons are tabbable in WebKit too
    expect(el.querySelector(".one")!.getAttribute("tabindex")).toBe("0");
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(el.querySelector(".one"));
    expect(el.pop.pinned).toBe(true);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(el.querySelector(".two"));
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(after);
  });

  test("Shift + Tab from the popover's first control goes back to the trigger", async () => {
    const { el, anchor } = await page();
    el.pop.show();
    await el.updateComplete;
    el.querySelector<HTMLElement>(".one")!.focus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(anchor);
    expect(el.pop.open).toBe(true);
  });

  test("off, or with the popover closed, Tab is the browser's", async () => {
    const { el, anchor } = await page({ tabBridge: false });
    el.pop.show();
    await el.updateComplete;
    expect(el.querySelector(".one")!.hasAttribute("tabindex")).toBe(false);
    const e = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    anchor.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
  });

  test("closeOnFocusOut: focus moving elsewhere closes it; into the popover doesn't", async () => {
    const { el, anchor, after } = await page({ closeOnFocusOut: true });
    anchor.focus();
    el.pop.show();
    await el.updateComplete;
    el.querySelector<HTMLElement>(".one")!.focus();
    expect(el.pop.open).toBe(true);
    after.focus();
    expect(el.pop.open).toBe(false);
    expect(el.closed).toEqual(["outside"]);
  });

  test("nextTabbable skips the trigger's contents, the skipped elements, and what can't take focus", async () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="t"><button>In</button></div><div id="s"><button>Skipped</button></div><button disabled>Off</button><span tabindex="-1">No</span><button hidden>Hidden</button><a href="#x" id="n">Next</a>`,
    );
    expect(nextTabbable(document.getElementById("t")!, [document.getElementById("s")])?.id).toBe("n");
    expect(nextTabbable(document.getElementById("n")!)).toBeNull();
  });
});
