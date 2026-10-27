/*
 * <tc-stories> in real browsers: the row (rings, names, people and accounts, the add tile, roving focus), the brief
 * (a native modal named by the entry, the count line, the summary, a tile per kind with the New marker, the bento
 * packing at three columns and one at 320 px), moving between entries by key and button, closing by Escape, Close and
 * the browser's cancel with focus back on the avatar, seen and open as cancelable values (one seen batch per opening),
 * tc-action, reply, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import "../../src/elements/stories";
import type { StoryActionEvent, StoryEntry, StoryOpen, StoryOpenChangeEvent, StoryReplyEvent, StorySeen, StorySeenChangeEvent, TcStories } from "../../src/elements/stories";
import { Stories } from "../../src/elements/react/stories";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const IMG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#335"/></svg>')}`;
const entries: StoryEntry[] = [
  {
    id: "maya",
    name: "Maya Chen",
    avatar: IMG,
    since: "Tue 09:41",
    summary: "Conversion is up and pricing is in review.",
    summaryGenerated: true,
    updates: [
      { id: "m-conv", kind: "metric", title: "Conversion", value: "8.4%", delta: 1.2, deltaUnit: " pts", context: "vs last week", trend: [7, 7.4, 8.4] },
      { id: "m-price", kind: "status", title: "Pricing page", from: "Draft", to: "In review", toTone: "info", text: "Waiting on legal.", at: "2h" },
      { id: "m-note", kind: "note", title: "Note", text: "Second pair of eyes, please.", author: "Maya Chen", at: "1h" },
      { id: "m-report", kind: "link", title: "Report", text: "Funnel by step.", label: "Open report", href: "#report" },
      { id: "m-setup", kind: "metric", title: "Setup time", value: "6m 40s", delta: -48, deltaUnit: "s", lowerIsBetter: true },
    ],
  },
  { id: "empty", name: "Nobody", updates: [] },
  {
    id: "northwind",
    name: "Northwind",
    kind: "account",
    updates: [
      { id: "n-members", kind: "list", title: "New members", items: ["Priya Shah", { label: "Tom Ellis", meta: "Viewer" }, "Ana Ruiz", "Jun Park", "Lee Wu"], total: 7 },
      { id: "n-seats", kind: "metric", title: "Seats", value: 42, delta: 7, neutral: true },
      { id: "n-review", kind: "link", title: "Access requests", label: "Review" },
    ],
  },
  {
    id: "leo",
    name: "Leo Park",
    updates: [
      { id: "l-launch", kind: "status", title: "Search v2", from: "Beta", to: "Live", toTone: "success" },
      { id: "l-shot", kind: "image", title: "Results page", src: IMG, alt: "Three results under a search field", caption: "Titles first." },
    ],
  },
];
const SEEN = () => new Set(["m-setup", "l-launch", "l-shot"]);

const make = (opts: { look?: "standard" | "clean"; seen?: StorySeen; addable?: boolean; replyable?: boolean; list?: StoryEntry[] } = {}) =>
  fixture<TcStories>(html`<tc-stories look=${opts.look ?? "standard"} .entries=${opts.list ?? entries} .seen=${opts.seen ?? SEEN()} ?addable=${opts.addable} ?replyable=${opts.replyable}></tc-stories>`);
const avatars = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-sty__row > .ui-sty__person")];
const avatarOf = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-sty__person[data-entry="${id}"]`)!;
const dialog = (el: Element) => el.querySelector<HTMLDialogElement>(".ui-sty__viewer")!;
const name = (el: Element) => document.getElementById(dialog(el).getAttribute("aria-labelledby")!)!.textContent;
const sub = (el: Element) => dialog(el).querySelector(".tc-head__sub")!.textContent;
const tiles = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-sty__tile")];
const tile = (el: Element, title: string) => tiles(el).find((t) => t.querySelector("h3")!.textContent === title)!;
const live = (el: Element) => el.querySelector(".ui-sty__sr[role=status]")!.textContent;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const finish = async (root: Element) => {
  for (const a of root.getAnimations?.({ subtree: true }) ?? []) a.finish();
  for (const a of document.getAnimations?.() ?? []) a.finish();
  await settle();
};
const openOn = async (el: TcStories, id: string) => {
  avatarOf(el, id).click();
  await settle();
  // The brief renders once the modal has opened – a frame or two later in a busy Firefox
  await expect.poll(() => !!el.querySelector(".ui-sty__close")).toBe(true);
};

describe("tc-stories", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host, the rings, people and accounts`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("sty");
      expect(el.dataset.look).toBe(look);
      const row = el.querySelector(".ui-sty__row")!;
      expect(row.getAttribute("role")).toBe("toolbar");
      expect(row.getAttribute("aria-label")).toBe("Updates");
      // Entries with no updates are left out
      expect(avatars(el).map((b) => b.getAttribute("aria-label"))).toEqual(["Maya Chen, 4 new", "Northwind, 3 new", "Leo Park, seen"]);
      expect(avatars(el).map((b) => b.dataset.state)).toEqual(["new", "new", "seen"]);
      expect(avatars(el).map((b) => b.dataset.kind)).toEqual(["person", "account", "person"]);
      expect(avatarOf(el, "maya").getAttribute("aria-haspopup")).toBe("dialog");
      expect(avatarOf(el, "maya").querySelector("img.ui-sty__img")!.getAttribute("alt")).toBe("");
      expect(avatarOf(el, "leo").querySelector(".ui-sty__initials")!.textContent).toBe("LP");
      // A person is round, an account square
      expect(getComputedStyle(avatarOf(el, "maya").querySelector(".ui-sty__ring")!).borderTopLeftRadius).toBe("50%");
      expect(getComputedStyle(avatarOf(el, "northwind").querySelector(".ui-sty__ring")!).borderTopLeftRadius).toMatch(/px$/);
      expect(el.querySelector(".ui-sty__row .tc-head")).toBeNull();
      expect(dialog(el).open).toBe(false);
    });
  }

  test("the ring is the --tc-story-ring gradient, the seen ring is quiet, and the ring width differs per look", async () => {
    const el = await make();
    const ring = getComputedStyle(avatarOf(el, "maya").querySelector(".ui-sty__ring")!);
    expect(ring.backgroundImage).toContain("conic-gradient");
    expect(getComputedStyle(avatarOf(el, "leo").querySelector(".ui-sty__ring")!).backgroundImage).toBe("none");
    el.style.setProperty("--tc-story-ring", "linear-gradient(red, blue)");
    expect(getComputedStyle(avatarOf(el, "maya").querySelector(".ui-sty__ring")!).backgroundImage).toContain("linear-gradient");
    const clean = await make({ look: "clean" });
    expect(parseFloat(getComputedStyle(avatarOf(clean, "maya").querySelector(".ui-sty__ring")!).paddingTop)).toBeLessThan(parseFloat(ring.paddingTop));
  });

  test("seen can be a record; `people` is the same list; the add tile fires tc-add; the empty state", async () => {
    const all = Object.fromEntries(entries.flatMap((e) => e.updates.map((u) => [u.id, true])));
    const el = await fixture<TcStories>(html`<tc-stories addable .people=${entries} .seen=${all}></tc-stories>`);
    expect(el.entries).toBe(el.people);
    expect(avatars(el)[0].classList.contains("ui-sty__add")).toBe(true);
    expect(avatars(el)[0].textContent!.trim()).toBe("Add update");
    expect(avatarOf(el, "maya").getAttribute("aria-label")).toBe("Maya Chen, seen");
    let added = 0;
    el.addEventListener("tc-add", () => added++);
    avatars(el)[0].click();
    expect(added).toBe(1);
    const none = await fixture<TcStories>(html`<tc-stories></tc-stories>`);
    expect(none.querySelector(".ui-sty__empty")!.textContent).toBe("Nothing new yet.");
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
    // Enter opens: it's a button
    expect(items[1].localName).toBe("button");
  });

  test("opening: a modal named by the entry, its count line and summary; one seen batch; new tiles first, marked New", async () => {
    const el = await make();
    const opens: StoryOpen[] = [];
    const seens: StorySeenChangeEvent[] = [];
    el.addEventListener("tc-open-change", (e) => opens.push((e as CustomEvent<StoryOpenChangeEvent>).detail.open));
    el.addEventListener("tc-seen-change", (e) => seens.push((e as CustomEvent<StorySeenChangeEvent>).detail));
    await openOn(el, "maya");
    const d = dialog(el);
    expect(d.open).toBe(true);
    expect(d.matches(":modal")).toBe(true);
    expect(name(el)).toBe("Maya Chen");
    expect(d.querySelector("h2")!.id).toBe(d.getAttribute("aria-labelledby"));
    expect(sub(el)).toBe("4 updates since you last looked · Tue 09:41");
    // The header's avatar is the entry's picture, round for a person
    expect(d.querySelector(".tc-head__icon")!.getAttribute("data-picture")).toBe("round");
    expect(d.querySelector(".tc-head__icon img")).not.toBeNull();
    expect(opens).toEqual(["maya"]);
    expect(el.open).toBe("maya");
    // One batch for the opening, with every unseen update
    expect(seens).toHaveLength(1);
    expect(seens[0].entry.id).toBe("maya");
    expect(seens[0].updates.map((u) => u.id)).toEqual(["m-conv", "m-price", "m-note", "m-report"]);
    expect([...(el.seen as Set<string>)].sort()).toEqual(["l-launch", "l-shot", "m-conv", "m-note", "m-price", "m-report", "m-setup"]);
    expect(avatarOf(el, "maya").getAttribute("aria-label")).toBe("Maya Chen, seen");
    // The summary, marked as generated
    expect(d.querySelector(".ui-sty__summary-text")!.textContent).toBe("Conversion is up and pricing is in review.");
    expect(d.querySelector(".ui-sty__generated")!.textContent!.trim()).toBe("AI summary");
    // New first, each with a heading and the marker; the seen one last, unmarked – and they keep it while open
    expect(tiles(el).map((t) => t.querySelector("h3")!.textContent)).toEqual(["Conversion", "Pricing page", "Note", "Report", "Setup time"]);
    expect(tiles(el).map((t) => t.hasAttribute("data-new"))).toEqual([true, true, true, true, false]);
    expect(tiles(el).map((t) => t.querySelector(".ui-sty__new")?.textContent ?? "")).toEqual(["New", "New", "New", "New", ""]);
    expect(d.querySelector(".ui-sty__grid")!.getAttribute("role")).toBe("list");
    // Focus starts on the content, inside the modal
    expect(document.activeElement).toBe(d.querySelector(".ui-sty__body"));
  });

  test("tiles: a metric, a status move, a note, a list, an image and a link, each designed for its kind", async () => {
    const el = await make({ seen: new Set() });
    await openOn(el, "maya");
    const conv = tile(el, "Conversion");
    expect(conv.dataset.kind).toBe("metric");
    expect(conv.dataset.size).toBe("small");
    expect(conv.querySelector(".ui-sty__value")!.textContent).toBe("8.4%");
    const delta = conv.querySelector<HTMLElement>(".ui-sty__delta")!;
    expect(delta.dataset.tone).toBe("good");
    expect(delta.textContent!.replace(/\s+/g, " ").trim()).toBe("+1.2 pts, better");
    expect(conv.querySelector(".ui-sty__context")!.textContent).toBe("vs last week");
    expect(conv.querySelector("svg.ui-sty__spark")!.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(delta).color).not.toBe(getComputedStyle(conv.querySelector(".ui-sty__context")!).color);
    // A drop where lower is better is good
    const setup = tile(el, "Setup time").querySelector<HTMLElement>(".ui-sty__delta")!;
    expect(setup.dataset.tone).toBe("good");
    expect(setup.textContent!.replace(/\s+/g, " ").trim()).toBe("−48s, better");
    // Status: from → to, with tones and a word between for screen readers
    const price = tile(el, "Pricing page");
    const states = [...price.querySelectorAll<HTMLElement>(".ui-sty__state")];
    expect(states.map((s) => [s.textContent, s.dataset.tone, s.hasAttribute("data-from")])).toEqual([
      ["Draft", "neutral", true],
      ["In review", "info", false],
    ]);
    expect(price.querySelector(".ui-sty__move")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Draft to In review");
    expect(price.querySelector(".ui-sty__at")!.textContent).toBe("2h");
    expect(price.querySelector(".ui-sty__text")!.textContent).toBe("Waiting on legal.");
    // Note: the text and the byline (its time goes in the byline, not the corner)
    const note = tile(el, "Note");
    expect(note.dataset.size).toBe("wide");
    expect(note.querySelector(".ui-sty__note")!.textContent).toBe("Second pair of eyes, please.");
    expect(note.querySelector(".ui-sty__byline")!.textContent).toBe("Maya Chen · 1h");
    expect(note.querySelector(".ui-sty__at")).toBeNull();
    // Link: an anchor that fires a cancelable tc-action; prevented, it doesn't navigate
    const link = tile(el, "Report").querySelector<HTMLAnchorElement>("a.ui-sty__action")!;
    expect(link.getAttribute("href")).toBe("#report");
    expect(link.textContent!.trim()).toBe("Open report");
    const acts: StoryActionEvent[] = [];
    el.addEventListener("tc-action", (e) => {
      acts.push((e as CustomEvent<StoryActionEvent>).detail);
      e.preventDefault();
    });
    const before = location.hash;
    link.click();
    expect(location.hash).toBe(before);
    expect(acts.map((a) => [a.entry.id, a.update.id])).toEqual([["maya", "m-report"]]);
    // A list with +N more, a neutral metric and a button action (Northwind); an image with its caption (Leo)
    key(dialog(el), "ArrowRight");
    await settle();
    const members = tile(el, "New members");
    expect(members.dataset.size).toBe("tall");
    expect([...members.querySelectorAll(".ui-sty__item-label")].map((i) => i.textContent)).toEqual(["Priya Shah", "Tom Ellis", "Ana Ruiz", "Jun Park"]);
    expect(members.querySelector(".ui-sty__item-meta")!.textContent).toBe("Viewer");
    expect(members.querySelector(".ui-sty__more")!.textContent).toBe("+3 more");
    const seats = tile(el, "Seats");
    expect(seats.querySelector(".ui-sty__value")!.textContent).toBe("42");
    expect(seats.querySelector<HTMLElement>(".ui-sty__delta")!.dataset.tone).toBe("neutral");
    expect(seats.querySelector(".ui-sty__delta")!.textContent!.trim()).toBe("+7");
    const review = tile(el, "Access requests").querySelector<HTMLButtonElement>("button.ui-sty__action")!;
    review.click();
    expect(acts.at(-1)!.update.id).toBe("n-review");
    // The account's header avatar is square
    expect(dialog(el).querySelector(".tc-head__icon")!.getAttribute("data-picture")).toBe("square");
    key(dialog(el), "ArrowRight");
    await settle();
    const shot = tile(el, "Results page");
    expect(shot.querySelector("img")!.alt).toBe("Three results under a search field");
    expect(shot.querySelector("figcaption")!.textContent).toBe("Titles first.");
  });

  test("tiles aren't tab stops; Tab runs through Close, the tiles' links and actions, then the foot", async () => {
    const el = await make({ replyable: true });
    await openOn(el, "maya");
    const d = dialog(el);
    expect(tiles(el).every((t) => t.tabIndex < 0)).toBe(true);
    const order = [...d.querySelectorAll<HTMLElement>("a[href], button, input")].filter((x) => x.tabIndex >= 0).map((x) => x.className.match(/ui-sty__\w+/g)!.at(-1));
    expect(order).toEqual(["ui-sty__close", "ui-sty__action", "ui-sty__field", "ui-sty__send", "ui-sty__prev", "ui-sty__next"]);
    // Only the content takes focus on opening, and it's not in the tab order
    expect(d.querySelector<HTMLElement>(".ui-sty__body")!.tabIndex).toBe(-1);
  });

  test("← → and Previous / Next move between entries, with the neighbours' names; nothing past either end", async () => {
    const el = await make();
    await openOn(el, "maya");
    const d = dialog(el);
    const prev = () => el.querySelector<HTMLButtonElement>(".ui-sty__prev")!;
    const next = () => el.querySelector<HTMLButtonElement>(".ui-sty__next")!;
    expect(prev().getAttribute("aria-disabled")).toBe("true");
    expect(prev().textContent!.replace(/\s+/g, " ").trim()).toBe("Previous");
    expect(next().textContent!.replace(/\s+/g, " ").trim()).toBe("Next Northwind");
    expect(el.querySelector(".ui-sty__where")!.textContent).toBe("1 / 3");
    key(d, "ArrowLeft");
    await settle();
    expect(el.open).toBe("maya");
    key(d, "ArrowRight");
    await settle();
    expect(el.open).toBe("northwind");
    expect(name(el)).toBe("Northwind");
    expect(live(el)).toBe("Northwind, 3 updates since you last looked");
    expect(prev().textContent!.replace(/\s+/g, " ").trim()).toBe("Previous Maya Chen");
    next().focus();
    next().click();
    await settle();
    expect(el.open).toBe("leo");
    // Leo's were all seen: nothing new, no markers, no seen event
    expect(sub(el)).toBe("2 updates, nothing new since you last looked");
    expect(tiles(el).some((t) => t.hasAttribute("data-new"))).toBe(false);
    expect(next().getAttribute("aria-disabled")).toBe("true");
    // Focus stays on Next, unavailable now, rather than being lost
    expect(document.activeElement).toBe(next());
    next().click();
    key(d, "ArrowRight");
    await settle();
    expect(el.open).toBe("leo");
    prev().click();
    await settle();
    expect(el.open).toBe("northwind");
    // A new entry starts at its top
    expect(el.querySelector<HTMLElement>(".ui-sty__body")!.scrollTop).toBe(0);
  });

  test("Escape, Close and the browser's cancel close; focus returns to the avatar of the entry last viewed", async () => {
    const el = await make();
    await openOn(el, "maya");
    key(dialog(el), "ArrowRight");
    await settle();
    key(dialog(el), "Escape");
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(el.open).toBeNull();
    expect(document.activeElement).toBe(avatarOf(el, "northwind"));
    expect(avatarOf(el, "northwind").tabIndex).toBe(0);
    await openOn(el, "maya");
    el.querySelector<HTMLButtonElement>(".ui-sty__close")!.click();
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(document.activeElement).toBe(avatarOf(el, "maya"));
    await openOn(el, "leo");
    dialog(el).dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(document.activeElement).toBe(avatarOf(el, "leo"));
  });

  test("controlled: a prevented tc-open-change keeps it closed; a prevented tc-seen-change keeps seen and the markers", async () => {
    const el = await make();
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-open-change", stop);
    avatarOf(el, "maya").click();
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(el.open).toBeNull();
    // The app opens it by setting open; Escape asks but stays open while prevented
    el.addEventListener("tc-seen-change", stop);
    el.open = "maya";
    await settle();
    expect(dialog(el).open).toBe(true);
    expect((el.seen as Set<string>).has("m-conv")).toBe(false);
    expect(tiles(el).filter((t) => t.hasAttribute("data-new"))).toHaveLength(4);
    key(dialog(el), "Escape");
    await settle();
    expect(dialog(el).open).toBe(true);
    el.removeEventListener("tc-open-change", stop);
    el.open = null;
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(avatarOf(el, "maya").getAttribute("aria-label")).toBe("Maya Chen, 4 new");
  });

  test("updates that arrive while the brief is open are marked New and seen in a second batch", async () => {
    const el = await make({ seen: new Set() });
    const seens: StorySeenChangeEvent[] = [];
    el.addEventListener("tc-seen-change", (e) => seens.push((e as CustomEvent<StorySeenChangeEvent>).detail));
    await openOn(el, "leo");
    expect(seens.map((s) => s.updates.length)).toEqual([2]);
    el.entries = entries.map((e) => (e.id === "leo" ? { ...e, updates: [...e.updates, { id: "l-new", kind: "note" as const, title: "Later", text: "One more thing." }] } : e));
    await settle();
    expect(seens.map((s) => s.updates.map((u) => u.id))).toEqual([["l-launch", "l-shot"], ["l-new"]]);
    expect(tile(el, "Later").hasAttribute("data-new")).toBe(true);
  });

  test("reply: sends tc-reply with the text and clears the field; arrows in the field don't move", async () => {
    const el = await make({ replyable: true });
    const replies: StoryReplyEvent[] = [];
    el.addEventListener("tc-reply", (e) => replies.push((e as CustomEvent<StoryReplyEvent>).detail));
    await openOn(el, "maya");
    const field = el.querySelector<HTMLInputElement>(".ui-sty__field")!;
    expect(field.getAttribute("aria-label")).toBe("Reply to Maya Chen");
    field.value = "  Looks great  ";
    el.querySelector<HTMLButtonElement>(".ui-sty__send")!.click();
    await settle();
    expect(replies.map((r) => [r.text, r.entry.id])).toEqual([["Looks great", "maya"]]);
    expect(field.value).toBe("");
    key(field, "ArrowRight");
    await settle();
    expect(el.open).toBe("maya");
  });

  test("the bento: tiles placed by size with no holes at three columns; one column filling the viewport at 320 px", async () => {
    await page.viewport(1280, 900);
    const el = await make({ seen: new Set() });
    await openOn(el, "leo");
    await finish(el);
    // Leo: a small status and a wide image share the row and fill it
    const [status, image] = tiles(el).map((t) => t.getBoundingClientRect());
    const grid = el.querySelector(".ui-sty__grid")!.getBoundingClientRect();
    expect(getComputedStyle(el.querySelector(".ui-sty__grid")!).gridTemplateColumns.split(" ")).toHaveLength(3);
    expect([Math.round(status.left), Math.round(image.right), Math.round(status.top)]).toEqual([Math.round(grid.left), Math.round(grid.right), Math.round(image.top)]);
    expect(image.width).toBeGreaterThan(status.width * 1.8);
    // Two small tiles: the second grows into the row's empty third column
    const two = await make({ list: [{ id: "x", name: "Two", updates: entries[3].updates.map((u) => ({ ...u, kind: "status" as const, from: "A", to: "B" })) }] });
    await openOn(two, "x");
    await finish(two);
    const [a, b] = tiles(two).map((t) => t.getBoundingClientRect());
    expect(Math.round(b.width)).toBeGreaterThan(Math.round(a.width * 1.8));
    expect(Math.round(b.right)).toBe(Math.round(two.querySelector(".ui-sty__grid")!.getBoundingClientRect().right));
    two.open = null;
    await settle();
    key(dialog(el), "ArrowLeft");
    await settle();
    // Northwind: the tall list takes two rows; the small tiles beside it grow down to meet it, leaving no hole
    expect(tile(el, "New members").style.getPropertyValue("--r3").trim()).toBe("1 / span 2");
    const members = tile(el, "New members").getBoundingClientRect();
    const seats = tile(el, "Seats").getBoundingClientRect();
    expect(Math.round(seats.bottom)).toBe(Math.round(members.bottom));
    await page.viewport(320, 700);
    try {
      await settle();
      await finish(el);
      const box = dialog(el).getBoundingClientRect();
      expect(Math.round(box.left)).toBe(16);
      expect(Math.round(box.right)).toBe(304);
      expect(getComputedStyle(el.querySelector(".ui-sty__grid")!).gridTemplateColumns.split(" ")).toHaveLength(1);
      const widths = tiles(el).map((t) => Math.round(t.getBoundingClientRect().width));
      expect(new Set(widths).size).toBe(1);
      expect(dialog(el).scrollWidth).toBeLessThanOrEqual(Math.ceil(box.width));
      // Close stays on the title's line
      const close = el.querySelector(".ui-sty__close")!.getBoundingClientRect();
      const title = dialog(el).querySelector("h2")!.getBoundingClientRect();
      expect(close.top).toBeLessThan(title.bottom);
    } finally {
      await page.viewport(1280, 900);
    }
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
        entries,
        defaultSeen: SEEN(),
        onSeenChange: (_s, updates, entry) => void log.push(["seen", entry.id, updates.length]),
        onOpenChange: (o) => void log.push(["open", o]),
        onAction: (update, _entry, event) => {
          event.preventDefault();
          log.push(["action", update.id]);
        },
        onAdd: () => void log.push(["add"]),
        onReply: (text, entry) => void log.push(["reply", text, entry.id]),
        "data-n": n,
      } as React.ComponentProps<typeof Stories>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-stories")!;
    expect(el.addable).toBe(true);
    expect(el.replyable).toBe(true);
    avatars(el)[0].click();
    avatarOf(el, "maya").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(dialog(el).open).toBe(true);
    el.querySelector<HTMLAnchorElement>("a.ui-sty__action")!.click();
    key(dialog(el), "ArrowRight");
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.open).toBe("northwind");
    key(dialog(el), "Escape");
    await settle();
    await act(async () => bump());
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(avatarOf(el, "maya").getAttribute("aria-label")).toBe("Maya Chen, seen");
    expect(log).toEqual([["add"], ["open", "maya"], ["seen", "maya", 4], ["action", "m-report"], ["open", "northwind"], ["seen", "northwind", 3], ["open", null]]);
    await act(async () => root.unmount());
  });

  test("React wrapper: controlled open and seen stay until the parent changes them; `people` still works", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: StoryOpen[] = [];
    const render = (open: StoryOpen) => act(async () => root.render(React.createElement(Stories, { people: entries, seen: SEEN(), open, onOpenChange: (o) => void asked.push(o) })));
    await render(null);
    await settle();
    const el = host.querySelector("tc-stories")!;
    avatarOf(el, "maya").click();
    await settle();
    expect(asked).toEqual(["maya"]);
    expect(dialog(el).open).toBe(false);
    await render("maya");
    await settle();
    expect(dialog(el).open).toBe(true);
    // Seen is controlled: the element asks but doesn't change it
    expect((el.seen as Set<string>).has("m-conv")).toBe(false);
    await render(null);
    await settle();
    expect(dialog(el).open).toBe(false);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    for (const look of ["standard", "clean"] as const) {
      test(`axe (${look}, ${theme}): no violations in the row or the open brief`, async () => {
        const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
          <tc-stories look=${look} addable replyable .entries=${entries} .seen=${new Set(["m-setup"])}></tc-stories>
        </div>`);
        const el = wrap.querySelector<TcStories>("tc-stories")!;
        await openOn(el, "maya");
        await finish(wrap);
        const run = () => axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        const report = (r: axe.AxeResults) => r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
        expect(report(await run())).toEqual([]);
        // Northwind: a list, a neutral metric and a button; Leo: a status and an image, all seen
        key(dialog(el), "ArrowRight");
        await finish(wrap);
        expect(report(await run())).toEqual([]);
        key(dialog(el), "ArrowRight");
        await finish(wrap);
        expect(report(await run())).toEqual([]);
        dialog(el).close();
      });
    }
  }
});
