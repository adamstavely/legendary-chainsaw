/*
 * <tc-notifications> in real browsers: the host and both looks, the bell and its badge, the panel as a dialog (focus,
 * Escape, focus return), the tabs, the day groups and relative times, the list's keyboard, every event and its
 * cancelation, the loading, error, empty and load-more states, announcements, 320 px, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import "../../src/elements/notifications";
import { notificationTime, TcNotifications, type NotificationItem, type NotificationsAction, type NotificationsDismiss, type NotificationsLoadMore, type NotificationsMarkAllRead, type NotificationsReadChange } from "../../src/elements/notifications";
import { Notifications } from "../../src/elements/react/notifications";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

/** Tuesday 27 October 2026, noon local time */
const NOW = new Date(2026, 9, 27, 12, 0).getTime();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const ITEMS: NotificationItem[] = [
  { id: "a", actor: "Maya Chen", title: "mentioned you in Q3 roadmap", body: "Can you check the launch dates?", time: NOW - 6 * MIN, category: "mentions", context: "Q3 roadmap", href: "#q3" },
  { id: "b", title: "Production deploy finished", time: NOW - 2 * HOUR, category: "system" },
  { id: "c", actor: "Jordan Park", title: "requested access to Revenue", time: NOW - 3 * HOUR, actions: [{ id: "approve", label: "Approve", primary: true }, { id: "decline", label: "Decline" }] },
  { id: "d", actor: "Sam Lee", title: "replied to your comment", time: NOW - DAY - HOUR, read: true, category: "mentions", dismissible: true },
  { id: "e", title: "Weekly digest", time: NOW - 3 * DAY, read: true },
  { id: "f", actor: "Ines Duarte", title: "shared a file", time: new Date(2026, 9, 10, 9, 30), read: true },
];
const CATEGORIES = [
  { id: "mentions", label: "Mentions" },
  { id: "system", label: "System" },
];
const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const webkit = /AppleWebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const names = (ids: string | null) => plain((ids ?? "").split(" ").map((id) => document.getElementById(id)?.textContent ?? "").join(" "));

type Opts = { look?: string; items?: NotificationItem[]; inline?: boolean; extra?: Partial<TcNotifications> };
const make = async (o: Opts = {}) => {
  const el = await fixture<TcNotifications>(
    html`<tc-notifications look=${o.look ?? "standard"} ?inline=${o.inline} locale="en-GB" .now=${NOW} .categories=${CATEGORIES} .items=${o.items ?? ITEMS}></tc-notifications>`,
  );
  if (o.extra) {
    Object.assign(el, o.extra);
    await settle();
  }
  return el;
};
const bell = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-ntc__trigger")!;
const pop = (el: Element) => el.querySelector<HTMLElement>(".ui-ntc__pop");
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-ntc__row")];
const ids = (el: Element) => rows(el).map((r) => r.dataset.id);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-ntc__row[data-id="${id}"]`)!;
const main = (el: Element, id: string) => row(el, id).querySelector<HTMLElement>(".ui-ntc__main")!;
const tabs = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-ntc__tab")];
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);
const collect = <T>(el: Element, name: string, prevent = false) => {
  const out: T[] = [];
  el.addEventListener(name, (e) => {
    out.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return out;
};
const openPanel = async (el: TcNotifications) => {
  bell(el).click();
  await settle();
};

describe("tc-notifications", () => {
  for (const look of looks) {
    test(`${look}: inline is a region named by the card header, with the panel and no bell`, async () => {
      const el = await make({ look, inline: true });
      expect(el.dataset.ui).toBe("ntc");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      const title = el.querySelector(".tc-head__title")!;
      expect(plain(title.textContent)).toBe("Notifications");
      expect(el.getAttribute("aria-labelledby")).toBe(title.id);
      expect(el.querySelector(".tc-head__aside .ui-ntc__mark")).not.toBeNull();
      expect(bell(el)).toBeNull();
      expect(rows(el)).toHaveLength(6);
    });
  }

  test("notificationTime: now, minutes, hours, days, then the date", () => {
    expect(notificationTime(NOW - 20_000, NOW, "en-GB")).toBe("now");
    expect(notificationTime(NOW - 5 * MIN, NOW, "en-GB")).toBe("5m");
    expect(notificationTime(NOW - 3 * HOUR, NOW, "en-GB")).toBe("3h");
    expect(notificationTime(NOW - 2 * DAY, NOW, "en-GB")).toBe("2d");
    expect(notificationTime(new Date(2026, 9, 10).getTime(), NOW, "en-GB")).toBe("10 Oct");
    expect(notificationTime(new Date(2025, 11, 31).getTime(), NOW, "en-GB")).toBe("31 Dec 2025");
    expect(notificationTime(NOW + HOUR, NOW, "en-GB")).toBe("now");
  });

  test("the bell: a button named with the exact count; the badge caps at max, or is a dot", async () => {
    const el = await make();
    const b = bell(el);
    expect(b.getAttribute("aria-haspopup")).toBe("dialog");
    expect(b.getAttribute("aria-expanded")).toBe("false");
    expect(b.getAttribute("aria-label")).toBe("Notifications, 3 unread");
    expect(plain(b.querySelector(".ui-ntc__badge")!.textContent)).toBe("3");
    el.unreadCount = 12;
    await settle();
    expect(b.getAttribute("aria-label")).toBe("Notifications, 12 unread");
    expect(plain(b.querySelector(".ui-ntc__badge")!.textContent)).toBe("9+");
    el.max = 99;
    await settle();
    expect(plain(b.querySelector(".ui-ntc__badge")!.textContent)).toBe("12");
    el.dot = true;
    await settle();
    expect(b.querySelector(".ui-ntc__badge")!.hasAttribute("data-dot")).toBe(true);
    expect(plain(b.querySelector(".ui-ntc__badge")!.textContent)).toBe("");
    expect(b.getAttribute("aria-label")).toBe("Notifications, 12 unread");
    el.unreadCount = undefined;
    el.items = ITEMS.map((n) => ({ ...n, read: true }));
    await settle();
    expect(b.querySelector(".ui-ntc__badge")).toBeNull();
    expect(b.getAttribute("aria-label")).toBe("Notifications");
  });

  test("grouped by day, newest first: Today, Yesterday, a weekday, then a date; relative times with the full time", async () => {
    const shuffled = [ITEMS[4], ITEMS[1], ITEMS[5], ITEMS[0], ITEMS[3], ITEMS[2]];
    const el = await make({ inline: true, items: shuffled });
    const groups = [...el.querySelectorAll(".ui-ntc__group")];
    expect(groups.map((g) => plain(g.querySelector(".ui-ntc__day")!.textContent))).toEqual(["Today", "Yesterday", "Saturday", "Sat 10 October"]);
    expect(groups.map((g) => [...g.querySelectorAll<HTMLElement>(".ui-ntc__row")].map((r) => r.dataset.id))).toEqual([["a", "b", "c"], ["d"], ["e"], ["f"]]);
    expect(groups[0].getAttribute("role")).toBe("group");
    expect(names(groups[0].getAttribute("aria-labelledby"))).toBe("Today");
    const time = row(el, "a").querySelector("time")!;
    expect(plain(time.textContent)).toBe("6m");
    expect(time.getAttribute("title")).toMatch(/^Tuesday,? 27 October 2026 at 11:54$/);
    expect(plain(row(el, "f").querySelector("time")!.textContent)).toBe("10 Oct");
    // `now` moves the groups on
    el.now = NOW + DAY;
    await settle();
    expect(plain(el.querySelector(".ui-ntc__day")!.textContent)).toBe("Yesterday");
  });

  test("a notification: link or button named by actor and title (with Unread), described by body, place and time", async () => {
    const el = await make({ inline: true });
    const a = main(el, "a");
    expect(a.tagName).toBe("A");
    expect(a.getAttribute("href")).toBe("#q3");
    // Its name is what it shows (no label-content mismatch), with "Unread" before it for screen readers
    expect(plain(a.textContent)).toBe("Unread, Maya Chen mentioned you in Q3 roadmap");
    expect(a.hasAttribute("aria-labelledby")).toBe(false);
    const described = (a.getAttribute("aria-describedby") ?? "").split(" ").map((id) => plain(document.getElementById(id)?.textContent));
    expect(described[0]).toBe("Can you check the launch dates?");
    expect(described[1]).toMatch(/^Q3 roadmap·6mTuesday,? 27 October 2026 at 11:54$/);
    expect(row(el, "a").querySelector(".ui-ntc__actor")!.tagName).toBe("STRONG");
    const b = main(el, "b");
    expect(b.tagName).toBe("BUTTON");
    expect(plain(b.textContent)).toBe("Unread, Production deploy finished");
    expect(plain(main(el, "d").textContent)).toBe("Sam Lee replied to your comment");
    // The read toggle and dismiss are named, and described by the title
    const dot = row(el, "a").querySelector(".ui-ntc__dot")!;
    expect(dot.getAttribute("aria-label")).toBe("Mark as read");
    expect(names(dot.getAttribute("aria-describedby"))).toBe("Maya Chen mentioned you in Q3 roadmap");
    expect(row(el, "d").querySelector(".ui-ntc__dot")!.getAttribute("aria-label")).toBe("Mark as unread");
    expect(row(el, "d").querySelector(".ui-ntc__dismiss")!.getAttribute("aria-label")).toBe("Dismiss");
    expect(row(el, "a").querySelector(".ui-ntc__dismiss")).toBeNull();
    el.dismissible = true;
    await settle();
    expect(row(el, "a").querySelector(".ui-ntc__dismiss")).not.toBeNull();
    // Avatars: initials for a person, the bell for an event; an image or the app's icon when given
    expect(plain(row(el, "a").querySelector(".ui-ntc__avatar")!.textContent)).toBe("MC");
    expect(row(el, "b").querySelector(".ui-ntc__avatar svg")).not.toBeNull();
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.classList.add("app-icon");
    el.items = [{ ...ITEMS[1], icon, tone: "success" }, { ...ITEMS[0], avatar: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" }];
    await settle();
    expect(row(el, "b").querySelector(".ui-ntc__avatar .app-icon")).not.toBeNull();
    expect(row(el, "b").querySelector(".ui-ntc__avatar")!.getAttribute("data-tone")).toBe("success");
    expect(row(el, "a").querySelector(".ui-ntc__avatar img")!.getAttribute("alt")).toBe("");
  });

  test("opening: a dialog named by its title, focus on the first notification; Escape closes and returns focus", async () => {
    const el = await make();
    const opens = collect<{ open: boolean }>(el, "tc-open-change");
    bell(el).focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    const p = pop(el)!;
    expect(p.getAttribute("role")).toBe("dialog");
    expect(names(p.getAttribute("aria-labelledby"))).toBe("Notifications");
    expect(bell(el).getAttribute("aria-expanded")).toBe("true");
    expect(bell(el).getAttribute("aria-controls")).toBe(p.id);
    expect(document.activeElement).toBe(main(el, "a"));
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(pop(el)).toBeNull();
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(bell(el));
    expect(opens.map((o) => o.open)).toEqual([true, false]);
  });

  test("tc-open-change can be prevented; a click outside closes the panel; an empty panel focuses the selected tab", async () => {
    const el = await make({ items: [] });
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-open-change", stop);
    await openPanel(el);
    expect(pop(el)).toBeNull();
    el.removeEventListener("tc-open-change", stop);
    await openPanel(el);
    expect(document.activeElement).toBe(tabs(el)[0]);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(pop(el)).toBeNull();
    expect(el.open).toBe(false);
  });

  test("tabs: the WAI-ARIA tab pattern – one tab stop, ← → wrap, Home End, selection follows focus", async () => {
    const el = await make({ inline: true });
    const list = el.querySelector<HTMLElement>(".ui-ntc__tabs")!;
    expect(list.getAttribute("role")).toBe("tablist");
    expect(list.getAttribute("aria-label")).toBe("Filter notifications");
    expect(tabs(el).map((t) => plain(t.textContent))).toEqual(["All", "Unread 3", "Mentions", "System"]);
    const panel = el.querySelector<HTMLElement>(".ui-ntc__scroll")!;
    expect(panel.getAttribute("role")).toBe("tabpanel");
    expect(tabs(el).every((t) => t.getAttribute("aria-controls") === panel.id)).toBe(true);
    const selected = () => tabs(el).findIndex((t) => t.getAttribute("aria-selected") === "true");
    const stops = () => tabs(el).filter((t) => t.tabIndex === 0).length;
    expect([selected(), stops()]).toEqual([0, 1]);
    const changes = collect<{ filter: string }>(el, "tc-filter-change");
    tabs(el)[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await settle();
    expect(selected()).toBe(1);
    expect(document.activeElement).toBe(tabs(el)[1]);
    expect(names(panel.getAttribute("aria-labelledby"))).toBe("Unread 3");
    expect(ids(el)).toEqual(["a", "b", "c"]);
    await userEvent.keyboard("{End}");
    await settle();
    expect(el.filter).toBe("system");
    expect(ids(el)).toEqual(["b"]);
    await userEvent.keyboard("{ArrowRight}");
    await settle();
    expect(el.filter).toBe("all");
    await userEvent.keyboard("{ArrowLeft}");
    await userEvent.keyboard("{Home}");
    await settle();
    expect(changes.map((c) => c.filter)).toEqual(["unread", "system", "all", "system", "all"]);
    expect(stops()).toBe(1);
  });

  test("tc-filter-change can be prevented (the app sets filter); the empty text says which tab is empty", async () => {
    const el = await make({ inline: true, items: ITEMS.filter((n) => n.category !== "system").map((n) => ({ ...n, read: true })) });
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-filter-change", stop);
    tabs(el)[1].click();
    await settle();
    expect(el.filter).toBe("all");
    el.removeEventListener("tc-filter-change", stop);
    tabs(el)[1].click();
    await settle();
    const state = () => plain(el.querySelector(".ui-ntc__state-title")?.textContent);
    expect(state()).toBe("No unread notifications");
    tabs(el)[3].click();
    await settle();
    expect(state()).toBe("Nothing here yet");
    el.items = [];
    el.filter = "all";
    await settle();
    expect(state()).toBe("You’re all caught up");
    expect(plain(el.querySelector(".ui-ntc__state-text")!.textContent)).toBe("New notifications will show up here.");
    // Nothing to focus: the tab panel takes the tab stop
    expect(el.querySelector<HTMLElement>(".ui-ntc__scroll")!.tabIndex).toBe(0);
  });

  test("list keyboard: one tab stop, ↓ ↑ across day groups, Home End; Tab reaches the focused row's controls", async () => {
    const el = await make();
    await openPanel(el);
    const stops = () => [...el.querySelectorAll<HTMLElement>(".ui-ntc__main")].filter((m) => m.tabIndex === 0).map((m) => m.dataset.id);
    expect(document.activeElement).toBe(main(el, "a"));
    expect(stops()).toEqual(["a"]);
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(main(el, "d"));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(main(el, "f"));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(main(el, "f"));
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(main(el, "e"));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(main(el, "a"));
    await settle();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await settle();
    expect(stops()).toEqual(["c"]);
    // Only the focused row's controls are in the tab order
    const inTab = [...el.querySelectorAll<HTMLElement>(".ui-ntc__acts button, .ui-ntc__dot, .ui-ntc__dismiss")].filter((b) => b.tabIndex === 0).map((b) => b.closest<HTMLElement>(".ui-ntc__row")!.dataset.id);
    expect(new Set(inTab)).toEqual(new Set(["c"]));
    if (!webkit) {
      await userEvent.keyboard("{Tab}");
      expect(document.activeElement).toBe(row(el, "c").querySelector('[data-action="approve"]'));
      await userEvent.keyboard("{Tab}");
      expect(document.activeElement).toBe(row(el, "c").querySelector('[data-action="decline"]'));
      await userEvent.keyboard("{Tab}");
      expect(document.activeElement).toBe(row(el, "c").querySelector(".ui-ntc__dot"));
    }
    // An arrow from an inner control moves to the next notification
    row(el, "c").querySelector<HTMLElement>('[data-action="decline"]')!.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(main(el, "d"));
  });

  test("opening a notification fires tc-item-open and marks it read; both can be prevented", async () => {
    const el = await make({ inline: true });
    const opened = collect<{ id: string }>(el, "tc-item-open", true);
    const reads = collect<NotificationsReadChange>(el, "tc-read-change");
    let navigated = true;
    el.addEventListener("click", (e) => (navigated = !e.defaultPrevented));
    main(el, "a").click();
    await settle();
    expect(opened.map((o) => o.id)).toEqual(["a"]);
    expect(navigated).toBe(false);
    expect(reads).toHaveLength(1);
    expect(reads[0].ids).toEqual(["a"]);
    expect(reads[0].read).toBe(true);
    expect(reads[0].items.find((n) => n.id === "a")!.read).toBe(true);
    expect(row(el, "a").hasAttribute("data-unread")).toBe(false);
    expect(bell(el)).toBeNull();
    // Prevented: the app keeps it unread
    el.addEventListener("tc-read-change", (e) => e.preventDefault());
    main(el, "b").click();
    await settle();
    expect(row(el, "b").hasAttribute("data-unread")).toBe(true);
    // Opening a read one doesn't fire a read change
    main(el, "d").click();
    await settle();
    expect(reads.map((r) => r.ids[0])).toEqual(["a", "b"]);
  });

  test("the read toggle marks read and unread; read in the Unread tab stays in view until the tab changes", async () => {
    const el = await make({ inline: true });
    const reads = collect<NotificationsReadChange>(el, "tc-read-change");
    row(el, "d").querySelector<HTMLElement>(".ui-ntc__dot")!.click();
    await settle();
    expect(reads[0]).toMatchObject({ ids: ["d"], read: false });
    expect(row(el, "d").hasAttribute("data-unread")).toBe(true);
    tabs(el)[1].click();
    await settle();
    expect(ids(el)).toEqual(["a", "b", "c", "d"]);
    row(el, "b").querySelector<HTMLElement>(".ui-ntc__dot")!.click();
    await settle();
    expect(ids(el)).toEqual(["a", "b", "c", "d"]);
    expect(row(el, "b").hasAttribute("data-unread")).toBe(false);
    expect(plain(tabs(el)[1].textContent)).toBe("Unread 3");
    tabs(el)[0].click();
    await settle();
    tabs(el)[1].click();
    await settle();
    expect(ids(el)).toEqual(["a", "c", "d"]);
  });

  test("Mark all as read: a cancelable tc-mark-all-read, applied unless prevented, disabled when nothing's unread, announced", async () => {
    const el = await make({ inline: true });
    const marks = collect<NotificationsMarkAllRead>(el, "tc-mark-all-read", true);
    const btn = el.querySelector<HTMLButtonElement>(".ui-ntc__mark")!;
    expect(plain(btn.textContent)).toBe("Mark all as read");
    btn.click();
    await settle();
    expect(marks[0].ids).toEqual(["a", "b", "c"]);
    expect(marks[0].items.every((n) => n.read)).toBe(true);
    expect(rows(el).filter((r) => r.hasAttribute("data-unread"))).toHaveLength(3);
    const el2 = await make({ inline: true });
    el2.querySelector<HTMLButtonElement>(".ui-ntc__mark")!.click();
    await settle();
    expect(rows(el2).filter((r) => r.hasAttribute("data-unread"))).toHaveLength(0);
    expect(el2.querySelector<HTMLButtonElement>(".ui-ntc__mark")!.disabled).toBe(true);
    expect(status(el2)).toBe("All notifications marked as read");
  });

  test("dismiss: a cancelable tc-dismiss with the list without it; focus moves to the next notification", async () => {
    const el = await make({ inline: true, extra: { dismissible: true } });
    const stop = collect<NotificationsDismiss>(el, "tc-dismiss", true);
    row(el, "b").querySelector<HTMLElement>(".ui-ntc__dismiss")!.click();
    await settle();
    expect(stop[0].id).toBe("b");
    expect(stop[0].items.map((n) => n.id)).toEqual(["a", "c", "d", "e", "f"]);
    expect(ids(el)).toContain("b");
    const el2 = await make({ inline: true, extra: { dismissible: true } });
    const x = row(el2, "b").querySelector<HTMLElement>(".ui-ntc__dismiss")!;
    x.focus();
    x.click();
    await settle();
    expect(ids(el2)).toEqual(["a", "c", "d", "e", "f"]);
    expect(document.activeElement).toBe(main(el2, "c"));
    expect(status(el2)).toBe("Notification dismissed");
  });

  test("inline actions: tc-action with { id, action }; it marks the notification read unless prevented", async () => {
    const el = await make({ inline: true });
    const acts = collect<NotificationsAction>(el, "tc-action");
    const approve = row(el, "c").querySelector<HTMLElement>('[data-action="approve"]')!;
    expect(approve.classList.contains("ui-ntc__btn--primary")).toBe(true);
    expect(names(approve.getAttribute("aria-describedby"))).toBe("Jordan Park requested access to Revenue");
    approve.click();
    await settle();
    expect(acts[0]).toMatchObject({ id: "c", action: "approve" });
    expect(row(el, "c").hasAttribute("data-unread")).toBe(false);
    const el2 = await make({ inline: true });
    el2.addEventListener("tc-action", (e) => e.preventDefault());
    row(el2, "c").querySelector<HTMLElement>('[data-action="decline"]')!.click();
    await settle();
    expect(row(el2, "c").hasAttribute("data-unread")).toBe(true);
  });

  test("Load more: tc-load-more with the oldest id and the count; it shows Loading more… until the page arrives", async () => {
    const el = await make({ inline: true, extra: { hasMore: true } });
    const asks = collect<NotificationsLoadMore>(el, "tc-load-more");
    const more = el.querySelector<HTMLButtonElement>(".ui-ntc__loadmore")!;
    expect(plain(more.textContent)).toBe("Load more");
    more.click();
    await settle();
    expect(asks).toEqual([{ after: "f", count: 6 }]);
    expect(el.loadingMore).toBe(true);
    expect(el.querySelector(".ui-ntc__loadmore")).toBeNull();
    expect(el.querySelector(".ui-ntc__more[data-busy] .ui-ntc__skeleton")).not.toBeNull();
    expect(el.querySelector(".ui-ntc__scroll")!.getAttribute("aria-busy")).toBe("true");
    el.items = [...ITEMS, { id: "g", title: "Older", time: NOW - 20 * DAY, read: true }];
    await settle();
    expect(el.loadingMore).toBe(false);
    expect(ids(el).at(-1)).toBe("g");
    // Prevented: the app shows its own loading state
    el.addEventListener("tc-load-more", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-ntc__loadmore")!.click();
    await settle();
    expect(el.loadingMore).toBe(false);
    expect(asks).toHaveLength(2);
  });

  test("infinite: the end of the list scrolling into view asks for more – once until the page arrives", async () => {
    const many = Array.from({ length: 30 }, (_, i): NotificationItem => ({ id: `n${i}`, title: `Notification ${i}`, time: NOW - i * HOUR, read: true }));
    const el = await make({ inline: true, items: many, extra: { hasMore: true, infinite: true } });
    el.style.setProperty("--tc-notifications-max-height", "300px");
    const asks = collect<NotificationsLoadMore>(el, "tc-load-more", true);
    await wait(100);
    expect(el.querySelector(".ui-ntc__loadmore")).toBeNull();
    expect(asks).toHaveLength(0);
    const scroller = el.querySelector<HTMLElement>(".ui-ntc__scroll")!;
    scroller.scrollTop = scroller.scrollHeight;
    await expect.poll(() => asks.length).toBe(1);
    scroller.scrollTop = 0;
    await wait(50);
    scroller.scrollTop = scroller.scrollHeight;
    await wait(150);
    expect(asks).toHaveLength(1);
    expect(asks[0]).toEqual({ after: "n29", count: 30 });
  });

  test("loading: a skeleton, busy, named for screen readers; error: the message and Try again (tc-retry)", async () => {
    const el = await make({ inline: true, items: [], extra: { loading: true } });
    const panel = el.querySelector(".ui-ntc__scroll")!;
    expect(panel.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelectorAll(".ui-ntc__skel-row")).toHaveLength(3);
    expect(plain(panel.querySelector(".ui-ntc__sr")!.textContent)).toBe("Loading notifications");
    el.loading = false;
    el.error = "The service didn’t respond.";
    await settle();
    expect(plain(el.querySelector('.ui-ntc__state[data-state="error"]')!.textContent)).toBe("Couldn’t load notifications The service didn’t respond. Try again");
    const retries = collect<object>(el, "tc-retry");
    el.querySelector<HTMLButtonElement>(".ui-ntc__retry")!.click();
    await settle();
    expect(retries).toHaveLength(1);
    expect(el.error).toBe("");
    expect(el.loading).toBe(true);
    // With notifications loaded, the error sits at the end of the list; Try again loads more
    const el2 = await make({ inline: true, extra: { error: "Network error", hasMore: true } });
    expect(rows(el2)).toHaveLength(6);
    expect(el2.querySelector('.ui-ntc__state[data-inline][data-state="error"]')).not.toBeNull();
    el2.addEventListener("tc-retry", (e) => e.preventDefault(), { once: true });
    el2.querySelector<HTMLButtonElement>(".ui-ntc__retry")!.click();
    await settle();
    expect(el2.error).toBe("Network error");
    el2.querySelector<HTMLButtonElement>(".ui-ntc__retry")!.click();
    await settle();
    expect(el2.loadingMore).toBe(true);
  });

  test("settings: a link or a button in the header; tc-settings can stop the link", async () => {
    const el = await make({ inline: true, extra: { settingsHref: "#settings" } });
    const link = el.querySelector<HTMLAnchorElement>(".ui-ntc__settings")!;
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("aria-label")).toBe("Notification settings");
    el.addEventListener("tc-settings", (e) => e.preventDefault());
    let followed = true;
    document.addEventListener("click", (e) => (followed = !e.defaultPrevented), { once: true });
    link.click();
    expect(followed).toBe(false);
    const el2 = await make({ inline: true, extra: { settings: true } });
    const fired = collect<object>(el2, "tc-settings");
    const btn = el2.querySelector<HTMLButtonElement>(".ui-ntc__settings")!;
    expect(btn.tagName).toBe("BUTTON");
    btn.click();
    expect(fired).toHaveLength(1);
    const el3 = await make({ inline: true });
    expect(el3.querySelector(".ui-ntc__settings")).toBeNull();
  });

  test("announcements: new arrivals once per update – one by name, a batch by count; not the first list, older pages or while loading", async () => {
    const el = await make({ extra: { pulse: true } });
    expect(status(el)).toBe("");
    el.items = [{ id: "n1", actor: "Alex Romero", title: "commented on Pricing", time: NOW }, ...ITEMS];
    await settle();
    expect(status(el)).toBe("New notification: Alex Romero commented on Pricing");
    expect(bell(el).querySelector(".ui-ntc__badge-wrap")!.hasAttribute("data-pulse")).toBe(true);
    el.items = [{ id: "n2", title: "A", time: NOW + MIN }, { id: "n3", title: "B", time: NOW + MIN }, { id: "n4", title: "C", time: NOW + MIN }, ...el.items];
    await settle();
    expect(status(el)).toBe("3 new notifications");
    // An older page and read arrivals aren't announced
    const before = el.status;
    el.items = [...el.items, { id: "old", title: "Old", time: NOW - 30 * DAY }, { id: "seen", title: "Seen", time: NOW + 2 * MIN, read: true }];
    await settle();
    expect(el.status).toBe(before);
    // While loading, nothing is announced
    el.loading = true;
    el.items = [{ id: "n9", title: "During load", time: NOW + 5 * MIN }, ...el.items];
    await settle();
    expect(el.status).toBe(before);
    el.loading = false;
    // A custom wording
    el.announce = (items) => `${items.length} more for you`;
    el.items = [{ id: "n10", title: "X", time: NOW + 9 * MIN }, ...el.items];
    await settle();
    expect(status(el)).toBe("1 more for you");
    // The first list isn't announced
    const fresh = await make();
    expect(status(fresh)).toBe("");
    expect(bell(fresh).querySelector("[data-pulse]")).toBeNull();
  });

  test("at 320 px the open panel fits the viewport", async () => {
    await page.viewport(320, 700);
    try {
      const el = await make();
      el.style.cssText = "position: fixed; top: 8px; right: 8px";
      await openPanel(el);
      await wait(200);
      const r = pop(el)!.getBoundingClientRect();
      expect(r.left).toBeGreaterThanOrEqual(0);
      expect(r.right).toBeLessThanOrEqual(320);
      expect(r.width).toBeGreaterThan(280);
      expect(pop(el)!.scrollWidth).toBeLessThanOrEqual(Math.ceil(r.width));
    } finally {
      await page.viewport(1280, 900);
    }
  });

  test("the wrapper: uncontrolled items survive a parent re-render; callbacks fire with what changed", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(Notifications, {
        inline: true,
        title: `Inbox ${n}`,
        now: NOW,
        defaultItems: ITEMS,
        onReadChange: (ids, read) => calls.push(`read:${ids.join()}:${read}`),
        onItemsChange: (next, change) => calls.push(`${change.action}:${next.filter((x) => !x.read).length}`),
        onItemOpen: (item) => (calls.push(`open:${item.id}`), false),
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcNotifications>("tc-notifications")!;
    main(el, "a").click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(plain(el.querySelector(".tc-head__title")!.textContent)).toBe("Inbox 1");
    expect(row(el, "a").hasAttribute("data-unread")).toBe(false);
    expect(calls).toEqual(["open:a", "read:a:true", "read:2"]);
    await act(async () => root.unmount());
  });

  test("the wrapper: controlled items and filter only report; onAction returning false keeps it unread", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(Notifications, {
          inline: true,
          now: NOW,
          items: ITEMS,
          filter: "all",
          onFilterChange: (f) => calls.push(`filter:${f}`),
          onMarkAllRead: (ids) => calls.push(`all:${ids.length}`),
          onAction: (item, action) => (calls.push(`${action}:${item.id}`), false),
          onLoadMore: (after, count) => calls.push(`more:${after}:${count}`),
          hasMore: true,
        }),
      ),
    );
    await settle();
    const el = host.querySelector<TcNotifications>("tc-notifications")!;
    tabs(el)[1].click();
    el.querySelector<HTMLButtonElement>(".ui-ntc__mark")!.click();
    row(el, "c").querySelector<HTMLElement>('[data-action="approve"]')!.click();
    el.querySelector<HTMLButtonElement>(".ui-ntc__loadmore")!.click();
    await act(async () => settle());
    expect(el.filter).toBe("all");
    expect(rows(el).filter((r) => r.hasAttribute("data-unread"))).toHaveLength(3);
    expect(calls).toEqual(["filter:unread", "all:3", "approve:c", "more:f:6"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look – the bell with its panel open, inline, empty, loading and error (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-notifications locale="en-GB" .now=${NOW} .categories=${CATEGORIES} .items=${ITEMS} settings-href="#s" has-more></tc-notifications>
        <tc-notifications look="clean" dot locale="en-GB" .now=${NOW} .items=${ITEMS}></tc-notifications>
        <tc-notifications inline locale="en-GB" .now=${NOW} .categories=${CATEGORIES} .items=${ITEMS} dismissible has-more settings></tc-notifications>
        <tc-notifications inline look="clean" locale="en-GB" .now=${NOW} .categories=${CATEGORIES} .items=${ITEMS} dismissible error="Network error"></tc-notifications>
        <tc-notifications inline .items=${[]}></tc-notifications>
        <tc-notifications inline look="clean" loading .items=${[]}></tc-notifications>
      </div>`);
      const [std] = [...wrap.querySelectorAll<TcNotifications>("tc-notifications")];
      await openPanel(std);
      await wait(300);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      expect(pop(std)).not.toBeNull();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
