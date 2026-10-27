/*
 * <tc-stories> in real browsers: the row (rings, names, the add tile, roving focus), the viewer (opening on the first
 * unseen item, stepping by key, tap and button, moving between people, closing by Escape, swipe and the last item,
 * focus in, trapped and restored), auto-advance and what pauses it, seen and open as cancelable values, reply, video
 * mute, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/stories";
import type { StoryOpen, StoryOpenChangeEvent, StoryPerson, StoryReplyEvent, StorySeen, StorySeenChangeEvent, TcStories } from "../../src/elements/stories";
import { Stories } from "../../src/elements/react/stories";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const IMG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 16"><rect width="9" height="16" fill="#335"/></svg>')}`;
const people: StoryPerson[] = [
  {
    id: "maya",
    name: "Maya Chen",
    avatar: IMG,
    items: [
      { id: "m1", kind: "image", src: IMG, text: "A sunrise", at: "2h" },
      { id: "m2", kind: "text", text: "Onboarding is live", tone: "teal", at: "1h" },
      { id: "m3", kind: "text", text: "Third", at: "40m" },
    ],
  },
  { id: "empty", name: "Nobody", items: [] },
  {
    id: "priya",
    name: "Priya Shah",
    items: [
      { id: "p1", kind: "text", text: "On call", at: "5h" },
      { id: "p2", kind: "text", text: "Billing", tone: "amber", at: "4h" },
    ],
  },
  { id: "ana", name: "Ana Ruiz", items: [{ id: "a1", kind: "text", text: "Peaks", at: "Yesterday" }] },
];
const SEEN = () => new Set(["p1", "a1"]);

const make = (opts: { look?: "standard" | "clean"; seen?: StorySeen; autoplay?: boolean; duration?: number; addable?: boolean; replyable?: boolean; list?: StoryPerson[] } = {}) =>
  fixture<TcStories>(html`<tc-stories
    look=${opts.look ?? "standard"}
    .people=${opts.list ?? people}
    .seen=${opts.seen ?? SEEN()}
    .autoplay=${opts.autoplay ?? false}
    .duration=${opts.duration ?? 5000}
    ?addable=${opts.addable}
    ?replyable=${opts.replyable}
  ></tc-stories>`);
const avatars = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-sty__row > .ui-sty__person")];
const avatarOf = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-sty__person[data-person="${id}"]`)!;
const dialog = (el: Element) => el.querySelector<HTMLDialogElement>(".ui-sty__viewer")!;
const media = (el: Element) => el.querySelector<HTMLElement>(".ui-sty__media")!;
const live = (el: Element) => el.querySelector(".ui-sty__sr")!.textContent;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const finish = async (root: Element) => {
  for (const a of root.getAnimations?.({ subtree: true }) ?? []) a.finish();
  for (const a of document.getAnimations?.() ?? []) a.finish();
  await settle();
};
const openOn = async (el: TcStories, id: string) => {
  avatarOf(el, id).click();
  await settle();
};
const pointer = (target: Element, type: string, x: number, y: number, init: PointerEventInit = {}) =>
  target.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 7, bubbles: true, cancelable: true, isPrimary: true, button: 0, ...init }));
/** Presses and releases at a fraction of the stage's width */
const tap = async (el: TcStories, fx: number, init: PointerEventInit = {}) => {
  const box = media(el).getBoundingClientRect();
  const x = box.left + box.width * fx;
  const y = box.top + box.height / 2;
  pointer(media(el), "pointerdown", x, y, init);
  pointer(media(el), "pointerup", x, y, init);
  await settle();
};

describe("tc-stories", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host, the rings and the names`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("sty");
      expect(el.dataset.look).toBe(look);
      const row = el.querySelector(".ui-sty__row")!;
      expect(row.getAttribute("role")).toBe("toolbar");
      expect(row.getAttribute("aria-label")).toBe("Stories");
      // People with no items are left out
      expect(avatars(el).map((b) => b.getAttribute("aria-label"))).toEqual(["Maya Chen, 3 new", "Priya Shah, 1 new", "Ana Ruiz, seen"]);
      expect(avatars(el).map((b) => b.dataset.state)).toEqual(["new", "new", "seen"]);
      expect(avatars(el).map((b) => b.querySelector(".ui-sty__label")!.textContent)).toEqual(["Maya Chen", "Priya Shah", "Ana Ruiz"]);
      expect(avatarOf(el, "maya").getAttribute("aria-haspopup")).toBe("dialog");
      // An image avatar, else initials
      expect(avatarOf(el, "maya").querySelector("img.ui-sty__img")!.getAttribute("alt")).toBe("");
      expect(avatarOf(el, "priya").querySelector(".ui-sty__initials")!.textContent).toBe("PS");
      expect(el.querySelector(".tc-head")).toBeNull();
      expect(dialog(el).open).toBe(false);
    });
  }

  test("the ring is the --tc-story-ring gradient, the seen ring is quiet, and the ring width differs per look", async () => {
    const el = await make();
    const ring = getComputedStyle(avatarOf(el, "maya").querySelector(".ui-sty__ring")!);
    expect(ring.backgroundImage).toContain("conic-gradient");
    const seen = getComputedStyle(avatarOf(el, "ana").querySelector(".ui-sty__ring")!);
    expect(seen.backgroundImage).toBe("none");
    el.style.setProperty("--tc-story-ring", "linear-gradient(red, blue)");
    expect(getComputedStyle(avatarOf(el, "maya").querySelector(".ui-sty__ring")!).backgroundImage).toContain("linear-gradient");
    const clean = await make({ look: "clean" });
    expect(parseFloat(getComputedStyle(avatarOf(clean, "maya").querySelector(".ui-sty__ring")!).paddingTop)).toBeLessThan(parseFloat(ring.paddingTop));
  });

  test("seen can be a record; the add tile comes first and fires tc-add; the empty state", async () => {
    const el = await make({ seen: { m1: true, m2: true, m3: true }, addable: true });
    expect(avatars(el)[0].classList.contains("ui-sty__add")).toBe(true);
    expect(avatars(el)[0].textContent!.trim()).toBe("Add story");
    expect(avatarOf(el, "maya").getAttribute("aria-label")).toBe("Maya Chen, seen");
    let added = 0;
    el.addEventListener("tc-add", () => added++);
    avatars(el)[0].click();
    expect(added).toBe(1);
    const none = await fixture<TcStories>(html`<tc-stories></tc-stories>`);
    expect(none.querySelector(".ui-sty__empty")!.textContent).toBe("No stories yet.");
    expect(none.querySelector(".ui-sty__row")).toBeNull();
  });

  test("the row is one tab stop; ← → Home End move between avatars", async () => {
    const el = await make({ addable: true });
    const items = avatars(el);
    expect(items.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1]);
    items[0].focus();
    key(items[0], "ArrowRight");
    expect(document.activeElement).toBe(items[1]);
    key(items[1], "End");
    expect(document.activeElement).toBe(items[3]);
    key(items[3], "ArrowRight");
    expect(document.activeElement).toBe(items[0]);
    key(items[0], "ArrowLeft");
    expect(document.activeElement).toBe(items[3]);
    key(items[3], "Home");
    expect(document.activeElement).toBe(items[0]);
    key(items[0], "ArrowRight");
    await settle();
    expect(items.map((b) => b.tabIndex)).toEqual([-1, 0, -1, -1]);
  });

  test("opening: a modal named by the person, on their first unseen item; seen and open change", async () => {
    const el = await make();
    const opens: StoryOpen[] = [];
    const seens: StorySeenChangeEvent[] = [];
    el.addEventListener("tc-open-change", (e) => opens.push((e as CustomEvent<StoryOpenChangeEvent>).detail.open));
    el.addEventListener("tc-seen-change", (e) => seens.push((e as CustomEvent<StorySeenChangeEvent>).detail));
    await openOn(el, "priya");
    const d = dialog(el);
    expect(d.open).toBe(true);
    expect(d.matches(":modal")).toBe(true);
    expect(document.getElementById(d.getAttribute("aria-labelledby")!)!.textContent).toBe("Priya Shah");
    expect(opens).toEqual([{ person: "priya", item: "p2" }]);
    expect(el.open).toEqual({ person: "priya", item: "p2" });
    expect(seens.map((s) => s.item.id)).toEqual(["p2"]);
    expect([...(el.seen as Set<string>)].sort()).toEqual(["a1", "p1", "p2"]);
    expect(live(el)).toBe("Priya Shah, 2 of 2");
    expect(el.querySelector(".ui-sty__at")!.textContent).toBe("4h");
    expect(el.querySelector(".ui-sty__card")!.getAttribute("data-tone")).toBe("amber");
    // Focus moves inside; the bars: one per item, the first done
    expect(d.contains(document.activeElement)).toBe(true);
    const bars = [...el.querySelectorAll(".ui-sty__bar")];
    expect(bars).toHaveLength(2);
    expect(bars[0].hasAttribute("data-done")).toBe(true);
    expect(bars[1].hasAttribute("data-current")).toBe(true);
    await settle();
    expect(avatarOf(el, "priya").getAttribute("aria-label")).toBe("Priya Shah, seen");
  });

  test("← → step through items and people; the last item closes and focus returns to that person's avatar", async () => {
    const el = await make();
    await openOn(el, "maya");
    const d = dialog(el);
    expect(live(el)).toBe("Maya Chen, 1 of 3");
    expect(el.querySelector<HTMLImageElement>(".ui-sty__photo")!.alt).toBe("A sunrise");
    key(d, "ArrowRight");
    await settle();
    expect(el.open).toEqual({ person: "maya", item: "m2" });
    expect(live(el)).toBe("2 of 3");
    key(d, "ArrowLeft");
    await settle();
    expect(el.open).toEqual({ person: "maya", item: "m1" });
    // Back from the very first item stays put
    key(d, "ArrowLeft");
    await settle();
    expect(el.open).toEqual({ person: "maya", item: "m1" });
    key(d, "ArrowRight");
    key(d, "ArrowRight");
    await settle();
    key(d, "ArrowRight");
    await settle();
    // On to Priya, at her first unseen item
    expect(el.open).toEqual({ person: "priya", item: "p2" });
    expect(live(el)).toBe("Priya Shah, 2 of 2");
    expect(document.getElementById(d.getAttribute("aria-labelledby")!)!.textContent).toBe("Priya Shah");
    // Back from a person's first item goes to the previous person's last
    key(d, "ArrowLeft");
    await settle();
    expect(el.open).toEqual({ person: "priya", item: "p1" });
    key(d, "ArrowLeft");
    await settle();
    expect(el.open).toEqual({ person: "maya", item: "m3" });
    key(d, "ArrowRight");
    await settle();
    key(d, "ArrowRight");
    await settle();
    key(d, "ArrowRight");
    await settle();
    expect(el.open).toEqual({ person: "ana", item: "a1" });
    key(d, "ArrowRight");
    await settle();
    expect(el.open).toBeNull();
    expect(d.open).toBe(false);
    expect(document.activeElement).toBe(avatarOf(el, "ana"));
    expect(avatarOf(el, "ana").tabIndex).toBe(0);
  });

  test("Escape and Close close; Previous and Next buttons step; Tab stays inside", async () => {
    const el = await make({ replyable: true });
    await openOn(el, "maya");
    el.querySelector<HTMLButtonElement>(".ui-sty__next")!.click();
    await settle();
    expect(el.open!.item).toBe("m2");
    el.querySelector<HTMLButtonElement>(".ui-sty__prev")!.click();
    await settle();
    expect(el.open!.item).toBe("m1");
    // Tab wraps
    const d = dialog(el);
    const focusables = [...d.querySelectorAll<HTMLElement>("button, input")];
    focusables[focusables.length - 1].focus();
    key(focusables[focusables.length - 1], "Tab");
    expect(document.activeElement).toBe(focusables[0]);
    key(focusables[0], "Tab", { shiftKey: true });
    expect(document.activeElement).toBe(focusables[focusables.length - 1]);
    key(d, "Escape");
    await settle();
    expect(d.open).toBe(false);
    expect(document.activeElement).toBe(avatarOf(el, "maya"));
    await openOn(el, "maya");
    el.querySelector<HTMLButtonElement>(".ui-sty__close")!.click();
    await settle();
    expect(dialog(el).open).toBe(false);
    // The native cancel (Escape from the browser) closes too
    await openOn(el, "maya");
    dialog(el).dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();
    expect(dialog(el).open).toBe(false);
  });

  test("tap the left or right third to step; a hold pauses and doesn't step; swipe down closes on touch", async () => {
    const el = await make();
    await openOn(el, "maya");
    await tap(el, 0.9);
    expect(el.open!.item).toBe("m2");
    await tap(el, 0.1);
    expect(el.open!.item).toBe("m1");
    await tap(el, 0.5);
    expect(el.open!.item).toBe("m1");
    // Held: the stage says so; released after a long press, nothing steps
    const box = media(el).getBoundingClientRect();
    pointer(media(el), "pointerdown", box.right - 4, box.top + 40);
    await settle();
    expect(el.querySelector(".ui-sty__stage")!.hasAttribute("data-held")).toBe(true);
    await wait(300);
    pointer(media(el), "pointerup", box.right - 4, box.top + 40);
    await settle();
    expect(el.querySelector(".ui-sty__stage")!.hasAttribute("data-held")).toBe(false);
    expect(el.open!.item).toBe("m1");
    // A mouse drag down doesn't close; a touch swipe down does
    pointer(media(el), "pointerdown", box.left + 100, box.top + 50);
    pointer(media(el), "pointerup", box.left + 100, box.top + 250);
    await settle();
    expect(dialog(el).open).toBe(true);
    pointer(media(el), "pointerdown", box.left + 100, box.top + 50, { pointerType: "touch" });
    pointer(media(el), "pointermove", box.left + 100, box.top + 150, { pointerType: "touch" });
    expect(el.querySelector<HTMLElement>(".ui-sty__stage")!.style.getPropertyValue("--dy")).toBe("100px");
    pointer(media(el), "pointerup", box.left + 102, box.top + 250, { pointerType: "touch" });
    await settle();
    expect(dialog(el).open).toBe(false);
  });

  test("auto-advance: each item for its duration, on to the next person, then closed", async () => {
    const list: StoryPerson[] = [
      { id: "a", name: "Ann", items: [{ id: "a1", kind: "text", text: "One", duration: 120 }, { id: "a2", kind: "text", text: "Two", duration: 120 }] },
      { id: "b", name: "Ben", items: [{ id: "b1", kind: "text", text: "Three", duration: 120 }] },
    ];
    const el = await make({ list, seen: new Set(), autoplay: true });
    const opened: StoryOpen[] = [];
    el.addEventListener("tc-open-change", (e) => opened.push((e as CustomEvent<StoryOpenChangeEvent>).detail.open));
    await openOn(el, "a");
    expect(el.querySelector(".ui-sty__play")!.getAttribute("aria-label")).toBe("Pause");
    await expect.poll(() => opened.length, { timeout: 3000 }).toBe(4);
    expect(opened).toEqual([{ person: "a", item: "a1" }, { person: "a", item: "a2" }, { person: "b", item: "b1" }, null]);
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(document.activeElement).toBe(avatarOf(el, "b"));
  });

  test("Pause, a hold and focus in the reply field each stop auto-advance", async () => {
    const list: StoryPerson[] = [{ id: "a", name: "Ann", items: [{ id: "a1", kind: "text", text: "One" }, { id: "a2", kind: "text", text: "Two" }] }];
    const el = await make({ list, seen: new Set(), autoplay: true, duration: 150, replyable: true });
    await openOn(el, "a");
    const play = el.querySelector<HTMLButtonElement>(".ui-sty__play")!;
    play.click();
    await settle();
    expect(play.getAttribute("aria-label")).toBe("Play");
    await wait(400);
    expect(el.open!.item).toBe("a1");
    play.click();
    await settle();
    // Focus in the reply field pauses
    el.querySelector<HTMLInputElement>(".ui-sty__field")!.focus();
    await settle();
    await wait(400);
    expect(el.open!.item).toBe("a1");
    play.focus();
    await settle();
    // Held pauses
    const box = media(el).getBoundingClientRect();
    pointer(media(el), "pointerdown", box.left + box.width / 2, box.top + 100);
    await settle();
    await wait(400);
    expect(el.open!.item).toBe("a1");
    pointer(media(el), "pointerup", box.left + box.width / 2, box.top + 100);
    await expect.poll(() => el.open?.item, { timeout: 2000 }).toBe("a2");
  });

  test("without autoplay (as with reduced motion) nothing advances: the bars show where you are", async () => {
    const el = await make({ seen: new Set(), duration: 50 });
    await openOn(el, "maya");
    await wait(300);
    expect(el.open!.item).toBe("m1");
    expect(el.querySelector(".ui-sty__play")).toBeNull();
    expect(el.querySelector<HTMLElement>(".ui-sty__bar[data-current] .ui-sty__fill")!.style.getPropertyValue("--p")).toBe("1");
    key(dialog(el), "ArrowRight");
    await settle();
    const fills = [...el.querySelectorAll<HTMLElement>(".ui-sty__fill")].map((f) => f.style.getPropertyValue("--p"));
    expect(fills).toEqual(["1", "1", "0"]);
  });

  test("controlled: a prevented tc-open-change keeps it closed; a prevented tc-seen-change keeps seen", async () => {
    const el = await make();
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-open-change", stop);
    avatarOf(el, "maya").click();
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(el.open).toBeNull();
    el.removeEventListener("tc-open-change", stop);
    // The app opens it by setting open; prevents seen
    el.addEventListener("tc-seen-change", stop);
    el.open = { person: "maya", item: "m2" };
    await settle();
    expect(dialog(el).open).toBe(true);
    expect(live(el)).toBe("Maya Chen, 2 of 3");
    expect((el.seen as Set<string>).has("m2")).toBe(false);
    el.open = null;
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(avatarOf(el, "maya").getAttribute("aria-label")).toBe("Maya Chen, 3 new");
  });

  test("reply: sends tc-reply with the text and clears the field", async () => {
    const el = await make({ replyable: true });
    const replies: StoryReplyEvent[] = [];
    el.addEventListener("tc-reply", (e) => replies.push((e as CustomEvent<StoryReplyEvent>).detail));
    await openOn(el, "maya");
    const field = el.querySelector<HTMLInputElement>(".ui-sty__field")!;
    expect(field.getAttribute("aria-label")).toBe("Reply to Maya Chen");
    field.value = "  Looks great  ";
    el.querySelector<HTMLButtonElement>(".ui-sty__send")!.click();
    await settle();
    expect(replies.map((r) => [r.text, r.person.id, r.item.id])).toEqual([["Looks great", "maya", "m1"]]);
    expect(field.value).toBe("");
    // Arrows in the field move the caret, not the story
    key(field, "ArrowRight");
    await settle();
    expect(el.open!.item).toBe("m1");
  });

  test("video: muted by default with a mute toggle, and Pause even without autoplay", async () => {
    const list: StoryPerson[] = [{ id: "v", name: "Vid", items: [{ id: "v1", kind: "video", src: "", text: "A clip" }] }];
    const el = await make({ list, seen: new Set() });
    await openOn(el, "v");
    const video = el.querySelector<HTMLVideoElement>(".ui-sty__video")!;
    expect(video.muted).toBe(true);
    expect(video.getAttribute("aria-label")).toBe("A clip");
    const mute = el.querySelector<HTMLButtonElement>(".ui-sty__mute")!;
    expect(mute.getAttribute("aria-label")).toBe("Unmute");
    mute.click();
    await settle();
    expect(video.muted).toBe(false);
    expect(mute.getAttribute("aria-label")).toBe("Mute");
    expect(el.querySelector(".ui-sty__play")).not.toBeNull();
  });

  test("React wrapper: uncontrolled seen and open survive re-renders; callbacks fire", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const log: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(Stories, {
        people,
        defaultSeen: SEEN(),
        autoplay: false,
        onSeenChange: (_s, item, person) => void log.push(["seen", person.id, item.id]),
        onOpenChange: (o) => void log.push(["open", o?.item ?? null]),
        onAdd: () => void log.push(["add"]),
        onReply: (text) => void log.push(["reply", text]),
        "data-n": n,
      } as React.ComponentProps<typeof Stories>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-stories")!;
    expect(el.addable).toBe(true);
    avatars(el)[0].click();
    avatarOf(el, "maya").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(dialog(el).open).toBe(true);
    key(dialog(el), "ArrowRight");
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.open).toEqual({ person: "maya", item: "m2" });
    expect(el.querySelector(".ui-sty__field")).not.toBeNull();
    key(dialog(el), "Escape");
    await settle();
    await act(async () => bump());
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(avatarOf(el, "maya").getAttribute("aria-label")).toBe("Maya Chen, 1 new");
    expect(log).toEqual([["add"], ["open", "m1"], ["seen", "maya", "m1"], ["open", "m2"], ["seen", "maya", "m2"], ["open", null]]);
    await act(async () => root.unmount());
  });

  test("React wrapper: controlled open and seen stay until the parent changes them", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: StoryOpen[] = [];
    const render = (open: StoryOpen) =>
      act(async () => root.render(React.createElement(Stories, { people, seen: SEEN(), open, autoplay: false, onOpenChange: (o) => void asked.push(o) })));
    await render(null);
    await settle();
    const el = host.querySelector("tc-stories")!;
    avatarOf(el, "maya").click();
    await settle();
    expect(asked).toEqual([{ person: "maya", item: "m1" }]);
    expect(dialog(el).open).toBe(false);
    await render({ person: "maya", item: "m1" });
    await settle();
    expect(dialog(el).open).toBe(true);
    // Seen is controlled: the element asks but doesn't change it
    expect((el.seen as Set<string>).has("m1")).toBe(false);
    await render(null);
    await settle();
    expect(dialog(el).open).toBe(false);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with the viewer open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-stories addable replyable .people=${people} .seen=${SEEN()} .autoplay=${false}></tc-stories>
        <tc-stories look="clean" .people=${people} .seen=${SEEN()} .autoplay=${false}></tc-stories>
      </div>`);
      const [a] = wrap.querySelectorAll<TcStories>("tc-stories");
      await openOn(a, "maya");
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      dialog(a).close();
    });
  }
});
