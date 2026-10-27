/*
 * <tc-isbn-details> in real browsers: parseIsbn / isValidIsbn / findIsbns, the marks, the hover card (intent delay,
 * moving into it, focus, Tab into and out of it, Escape), lookups through the resolver and the event, the cache,
 * loading / error / not found, Copy, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/isbn-details";
import { findIsbns, isValidIsbn, parseIsbn, type IsbnBook, type IsbnCopyDetail, type IsbnLookupDetail, type IsbnResolver, type TcIsbnDetails } from "../../src/elements/isbn-details";
import { IsbnDetails } from "../../src/elements/react/isbn-details";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => cleanup());

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

describe("parseIsbn / isValidIsbn", () => {
  test("valid ISBN-10s convert to ISBN-13 (978 prefix, new check digit)", () => {
    expect(parseIsbn("0306406152")).toEqual({ isbn10: "0306406152", isbn13: "9780306406157", valid: true });
    expect(parseIsbn("0-13-110362-8")).toEqual({ isbn10: "0131103628", isbn13: "9780131103627", valid: true });
    expect(parseIsbn("0 19 853453 1")).toEqual({ isbn10: "0198534531", isbn13: "9780198534532", valid: true });
  });

  test("an X check digit, either case", () => {
    expect(parseIsbn("0-8044-2957-X")).toEqual({ isbn10: "080442957X", isbn13: "9780804429573", valid: true });
    expect(parseIsbn("155860832x")).toEqual({ isbn10: "155860832X", isbn13: "9781558608320", valid: true });
    expect(isValidIsbn("0-395-92720-X")).toBe(true);
    // X anywhere but the tenth place, or as an ISBN-13's digit, isn't valid
    expect(isValidIsbn("08044X2957")).toBe(false);
    expect(isValidIsbn("978080442957X")).toBe(false);
  });

  test("valid 978 ISBN-13s convert back to ISBN-10", () => {
    expect(parseIsbn("978-0-306-40615-7")).toEqual({ isbn10: "0306406152", isbn13: "9780306406157", valid: true });
    expect(parseIsbn("9780804429573")).toEqual({ isbn10: "080442957X", isbn13: "9780804429573", valid: true });
    expect(parseIsbn("978 1 59327 584 6")).toEqual({ isbn10: "1593275846", isbn13: "9781593275846", valid: true });
  });

  test("979 ISBN-13s are valid but have no ISBN-10", () => {
    expect(parseIsbn("979-10-90636-07-1")).toEqual({ isbn13: "9791090636071", valid: true });
    expect(parseIsbn("9798654632401")).toEqual({ isbn13: "9798654632401", valid: true });
    expect("isbn10" in parseIsbn("9791000000008")).toBe(false);
  });

  test('"ISBN", "ISBN-10" and "ISBN-13" labels, with or without a colon', () => {
    expect(parseIsbn("ISBN 0-306-40615-2").isbn13).toBe("9780306406157");
    expect(parseIsbn("ISBN-10: 0306406152").valid).toBe(true);
    expect(parseIsbn("isbn-13: 978-0-306-40615-7").valid).toBe(true);
    expect(parseIsbn("ISBN:9780306406157").valid).toBe(true);
    expect(parseIsbn("  9780306406157  ").valid).toBe(true);
  });

  test("wrong check digits, wrong lengths and other characters are invalid", () => {
    for (const bad of ["0306406153", "9780306406158", "030640615", "97803064061577", "03064O6152", "", "ISBN", "978-0-306-40615", "0-306-40615-2 7"]) {
      expect(parseIsbn(bad), bad).toEqual({ isbn13: "", valid: false });
    }
    // A valid EAN-13 that isn't a book (no 978 / 979 prefix)
    expect(isValidIsbn("4006381333931")).toBe(false);
    // A 13-digit number with the 978 prefix but a failing checksum
    expect(isValidIsbn("9781234567890")).toBe(false);
    expect(isValidIsbn(undefined as unknown as string)).toBe(false);
  });
});

describe("findIsbns", () => {
  const found = (t: string) => findIsbns(t).map((m) => m.text);

  test("compact, hyphenated and spaced forms, with or without a label; the range covers the number", () => {
    const t = "See ISBN 0-306-40615-2, ISBN-13: 978-0-13-110362-7 and 9780804429573 (or 0 19 853453 1).";
    const m = findIsbns(t);
    expect(m.map((x) => x.text)).toEqual(["0-306-40615-2", "978-0-13-110362-7", "9780804429573", "0 19 853453 1"]);
    expect(m[0]).toEqual({ start: t.indexOf("0-306"), end: t.indexOf("0-306") + 13, text: "0-306-40615-2", isbn13: "9780306406157", isbn10: "0306406152" });
    expect(m.map((x) => x.isbn13)).toEqual(["9780306406157", "9780131103627", "9780804429573", "9780198534532"]);
  });

  test("ISBN-13 written as prefix, hyphen, rest; X digits; 979; right after the label; at the text's ends", () => {
    expect(found("978-0306406157")).toEqual(["978-0306406157"]);
    expect(found("Order 0-8044-2957-X today")).toEqual(["0-8044-2957-X"]);
    expect(found("ISBN979-10-90636-07-1")).toEqual(["979-10-90636-07-1"]);
    expect(findIsbns("979-10-90636-07-1")[0].isbn10).toBeUndefined();
    expect(found("ISBN-10:0306406152.")).toEqual(["0306406152"]);
    expect(found("(9780306406157)")).toEqual(["9780306406157"]);
  });

  test("two numbers side by side are found separately", () => {
    expect(found("0306406152 9780131103627")).toEqual(["0306406152", "9780131103627"]);
    expect(found("0306406152, 0131103628 and 080442957X")).toEqual(["0306406152", "0131103628", "080442957X"]);
  });

  test("lookalikes aren't found: failing check digits, phone numbers, order ids, longer numbers", () => {
    // Fails the checksum
    expect(found("ISBN 0-306-40615-3 and 978-0-306-40615-8")).toEqual([]);
    // Phone numbers, however written
    expect(found("Call 555-123-4567 or (020) 7946 0958 or +1 415 555 0132")).toEqual([]);
    expect(found("Call 0306406152x")).toEqual([]);
    // A 13-digit order id with a valid EAN checksum but no book prefix, and one with the prefix but a bad checksum
    expect(found("Order 4006381333931 shipped; ref 9781234567890")).toEqual([]);
    // Inside a longer number, a word or a decimal
    expect(found("Tracking 1Z0306406152 / 103064061520 / 97803064061570 / 1.0306406152 / 12-0306406152")).toEqual([]);
    // A valid number followed by more digits after a hyphen
    expect(found("0306406152-7")).toEqual([]);
    // Wrongly grouped: mixed separators or a lone separator in an ISBN-10
    expect(found("0-306 40615-2 or 03064-06152")).toEqual([]);
    expect(found("")).toEqual([]);
  });
});

/* ---------- The element ---------- */

const TEXT = "Start with ISBN 978-0-306-40615-7, then 0-8044-2957-X. Skip order 9781234567890.\nThe 979 one: 979-10-90636-07-1.";
const BOOKS: Record<string, IsbnBook> = {
  "9780306406157": { title: "Signals and Systems", subtitle: "A primer", authors: ["Ada Moreno", "Li Wei"], publisher: "Northgate Press", year: 2019, pages: 412, cover: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'%3E%3Crect width='2' height='3' fill='%23345'/%3E%3C/svg%3E" },
  "9780804429573": { title: "Field Notes", authors: ["Sam Ortiz"], year: "1998" },
};
type Calls = { isbn: string; signal: AbortSignal }[];
const resolver = (calls: Calls, books = BOOKS, ms = 0): IsbnResolver =>
  (isbn, signal) => {
    calls.push({ isbn, signal });
    return new Promise((res) => setTimeout(() => res(books[isbn] ?? null), ms));
  };

const make = (o: { look?: string; resolve?: IsbnResolver; text?: string } = {}) =>
  fixture<TcIsbnDetails>(html`<tc-isbn-details style="width: 520px" look=${o.look ?? "standard"} hover-delay="60" .text=${o.text ?? TEXT} .resolve=${o.resolve}></tc-isbn-details>`);
const marksOf = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-isbn__mark")];
const card = (el: Element) => el.querySelector<HTMLElement>(".ui-isbn__pop");
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);
const enter = (t: Element) => t.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
const leave = (t: Element) => t.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
const ready = async (el: TcIsbnDetails, ms = 30) => {
  await wait(ms);
  await settle(el.parentElement!);
};
const title = (c: Element) => document.getElementById(c.getAttribute("aria-labelledby")!)?.textContent;
/** Waits until a card is open and done looking up (and `check` holds on it, when given) */
const opened = async (el: TcIsbnDetails, check: (c: HTMLElement) => boolean = () => true) => {
  await expect
    .poll(() => {
      const c = card(el);
      return !!c && c.dataset.status !== "loading" && check(c);
    }, { timeout: 3000 })
    .toBe(true);
  await settle(el.parentElement!);
};

describe("tc-isbn-details", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: only valid ISBNs become marks; the text is unchanged`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("isbn");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-isbn__text")!.textContent).toBe(TEXT);
      expect(marksOf(el).map((m) => m.textContent)).toEqual(["978-0-306-40615-7", "0-8044-2957-X", "979-10-90636-07-1"]);
      expect(el.isbns.map((m) => m.isbn13)).toEqual(["9780306406157", "9780804429573", "9791090636071"]);
      const m = marksOf(el)[0];
      expect(m.tagName).toBe("BUTTON");
      expect(m.getAttribute("aria-haspopup")).toBe("dialog");
      expect(m.getAttribute("aria-expanded")).toBe("false");
      expect(plain(document.getElementById(m.getAttribute("aria-describedby")!)!.textContent)).toBe("Book details. Tab moves into them");
      expect(card(el)).toBeNull();
    });
  }

  test("hover opens the card after the intent delay; it shows the book and both forms", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls) });
    const opens: (string | null)[] = [];
    el.addEventListener("tc-open-change", (e) => opens.push((e as CustomEvent).detail.isbn13));
    enter(marksOf(el)[0]);
    await wait(20);
    await el.updateComplete;
    expect(card(el)).toBeNull();
    await opened(el);
    const c = card(el)!;
    expect(c.getAttribute("role")).toBe("dialog");
    expect(getComputedStyle(c).position).toBe("fixed");
    expect(calls.map((x) => x.isbn)).toEqual(["9780306406157"]);
    expect(calls[0].signal).toBeInstanceOf(AbortSignal);
    expect(document.getElementById(c.getAttribute("aria-labelledby")!)!.textContent).toBe("Signals and Systems: A primer");
    expect(plain(c.querySelector(".ui-isbn__authors")!.textContent)).toBe("Ada Moreno, Li Wei");
    expect(plain(c.querySelector(".ui-isbn__meta")!.textContent)).toBe("Northgate Press · , 2019 · , 412 pages");
    expect(c.querySelector<HTMLImageElement>(".ui-isbn__img")!.src).toContain("data:image/svg+xml");
    expect([...c.querySelectorAll(".ui-isbn__id")].map((r) => plain(r.textContent))).toEqual(["ISBN-13 9780306406157", "ISBN-10 0306406152"]);
    expect(marksOf(el)[0].getAttribute("aria-expanded")).toBe("true");
    expect(opens).toEqual(["9780306406157"]);
  });

  test("the default intent delay is 300 ms", async () => {
    const el = await fixture<TcIsbnDetails>(html`<tc-isbn-details .text=${TEXT}></tc-isbn-details>`);
    expect(el.hoverDelay).toBe(300);
    enter(marksOf(el)[0]);
    await wait(150);
    await el.updateComplete;
    expect(card(el)).toBeNull();
    await expect.poll(() => card(el), { timeout: 3000 }).not.toBeNull();
  });

  test("the card stays open while the pointer moves from the mark into it, and closes when it leaves both", async () => {
    const el = await make({ resolve: resolver([]) });
    const m = marksOf(el)[0];
    enter(m);
    await opened(el);
    leave(m);
    await wait(60);
    enter(card(el)!);
    await wait(300);
    await el.updateComplete;
    expect(card(el)).not.toBeNull();
    leave(card(el)!);
    await expect.poll(() => card(el), { timeout: 3000 }).toBeNull();
    // Leaving the mark before the delay runs out never opens it
    enter(m);
    await wait(20);
    leave(m);
    await wait(120);
    await el.updateComplete;
    expect(card(el)).toBeNull();
  });

  test("moving from one mark to another with a card open switches at once", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls) });
    enter(marksOf(el)[0]);
    await opened(el);
    leave(marksOf(el)[0]);
    enter(marksOf(el)[1]);
    await opened(el, (c) => title(c) === "Field Notes");
    expect(document.getElementById(card(el)!.getAttribute("aria-labelledby")!)!.textContent).toBe("Field Notes");
    expect(calls.map((x) => x.isbn)).toEqual(["9780306406157", "9780804429573"]);
  });

  test("keyboard: focus opens it, Tab goes in, Shift+Tab back, Tab from the last control to the next mark, Esc closes", async () => {
    const el = await make({ resolve: resolver([]) });
    const [a, b] = marksOf(el);
    a.focus();
    await opened(el);
    expect(card(el)).not.toBeNull();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(card(el)!.querySelector('[aria-label="Copy ISBN-13"]'));
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(a);
    expect(card(el)).not.toBeNull();
    await userEvent.keyboard("{Tab}{Tab}");
    expect(document.activeElement).toBe(card(el)!.querySelector('[aria-label="Copy ISBN-10"]'));
    await userEvent.keyboard("{Tab}");
    await opened(el, (c) => title(c) === "Field Notes");
    expect(document.activeElement).toBe(b);
    expect(document.getElementById(card(el)!.getAttribute("aria-labelledby")!)!.textContent).toBe("Field Notes");
    // Esc from inside the card: it closes, focus back on its mark
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(card(el)).toBeNull();
    expect(document.activeElement).toBe(b);
    expect(b.getAttribute("aria-expanded")).toBe("false");
  });

  test("Enter on a mark moves focus into its card; a click pins it and a second click closes it", async () => {
    const el = await make({ resolve: resolver([]) });
    const [a] = marksOf(el);
    a.focus();
    await opened(el);
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(card(el)).toBeNull();
    await userEvent.keyboard("{Enter}");
    await opened(el, (c) => c.contains(document.activeElement));
    expect(card(el)!.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(document.activeElement).toBe(a);
    a.blur();
    a.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await opened(el);
    expect(card(el)).not.toBeNull();
    // Pinned: leaving doesn't close it
    leave(a);
    await wait(300);
    await el.updateComplete;
    expect(card(el)).not.toBeNull();
    a.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await el.updateComplete;
    expect(card(el)).toBeNull();
  });

  test("openCard() opens a card pinned, without moving focus; closeCard() closes it", async () => {
    const el = await make({ resolve: resolver([]) });
    el.openCard(1);
    await opened(el, (c) => title(c) === "Field Notes");
    expect(document.getElementById(card(el)!.getAttribute("aria-labelledby")!)!.textContent).toBe("Field Notes");
    expect(document.activeElement).toBe(document.body);
    leave(marksOf(el)[1]);
    await wait(300);
    await el.updateComplete;
    expect(card(el)).not.toBeNull();
    el.closeCard();
    await el.updateComplete;
    expect(card(el)).toBeNull();
  });

  test("a pointer-down outside closes it", async () => {
    const el = await make({ resolve: resolver([]) });
    marksOf(el)[0].dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await opened(el);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(card(el)).toBeNull();
  });

  test("details are cached by ISBN: the same number twice, or reopened, is looked up once", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls), text: "0306406152 and again 978-0-306-40615-7." });
    const [a, b] = marksOf(el);
    a.focus();
    await opened(el);
    b.focus();
    await opened(el);
    a.focus();
    await opened(el);
    expect(calls).toHaveLength(1);
    el.clearCache("9780306406157");
    b.focus();
    await expect.poll(() => calls.length, { timeout: 3000 }).toBe(2);
    await opened(el);
  });

  test("loading, then an error with Retry, then the book; results are announced", async () => {
    let fail = true;
    const el = await make({
      resolve: (isbn) =>
        new Promise<IsbnBook | null>((res, rej) =>
          setTimeout(() => (fail ? rej(new Error("offline")) : res(BOOKS[isbn] ?? null)), 80),
        ),
    });
    marksOf(el)[0].focus();
    await expect.poll(() => card(el)?.dataset.status, { timeout: 3000 }).toBe("loading");
    const c = card(el)!;
    expect(c.getAttribute("aria-busy")).toBe("true");
    expect(c.dataset.status).toBe("loading");
    expect(plain(c.textContent)).toContain("Looking up this ISBN…");
    expect(c.getAttribute("aria-label")).toBe("Book details for ISBN 9780306406157");
    await expect.poll(() => card(el)?.dataset.status, { timeout: 3000 }).toBe("error");
    expect(card(el)!.dataset.status).toBe("error");
    expect(plain(card(el)!.querySelector(".ui-isbn__msg")!.textContent)).toBe("Couldn't load the details.");
    expect(status(el)).toBe("Couldn't load the details.");
    fail = false;
    card(el)!.querySelector<HTMLButtonElement>(".ui-isbn__retry")!.click();
    await expect.poll(() => card(el)?.dataset.status, { timeout: 3000 }).toBe("loading");
    expect(card(el)!.dataset.status).toBe("loading");
    await expect.poll(() => card(el)?.dataset.status, { timeout: 3000 }).toBe("done");
    expect(card(el)!.dataset.status).toBe("done");
    expect(status(el)).toBe("Signals and Systems, by Ada Moreno, Li Wei");
  });

  test('no resolver and no listener, or no book: "No details for this ISBN"; a 979 number has no ISBN-10', async () => {
    const el = await make();
    marksOf(el)[2].focus();
    await opened(el);
    const c = card(el)!;
    expect(c.dataset.status).toBe("empty");
    expect(plain(c.querySelector(".ui-isbn__msg")!.textContent)).toBe("No details for this ISBN");
    expect(c.querySelector(".ui-isbn__cover[data-empty]")).not.toBeNull();
    expect([...c.querySelectorAll(".ui-isbn__id")].map((r) => plain(r.textContent))).toEqual(["ISBN-13 9791090636071", "ISBN-10 None – a 979 ISBN has no ISBN-10"]);
    expect(c.querySelectorAll(".ui-isbn__copy")).toHaveLength(1);
    el.notFoundText = "Not in the catalogue";
    await el.updateComplete;
    expect(plain(card(el)!.querySelector(".ui-isbn__msg")!.textContent)).toBe("Not in the catalogue");
  });

  test("tc-isbn-lookup: respondWith() answers before the resolver; preventing without an answer means no details", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls) });
    const seen: IsbnLookupDetail[] = [];
    el.addEventListener("tc-isbn-lookup", (e) => {
      const d = (e as CustomEvent<IsbnLookupDetail>).detail;
      seen.push(d);
      if (d.isbn13 === "9780306406157") d.respondWith(Promise.resolve({ title: "From the event", authors: ["Event Author"] }));
      else e.preventDefault();
    });
    marksOf(el)[0].focus();
    await opened(el, (c) => title(c) === "From the event");
    expect(document.getElementById(card(el)!.getAttribute("aria-labelledby")!)!.textContent).toBe("From the event");
    marksOf(el)[1].focus();
    await opened(el, (c) => plain(c.querySelector(".ui-isbn__msg")?.textContent) === "No details for this ISBN");
    expect(plain(card(el)!.querySelector(".ui-isbn__msg")!.textContent)).toBe("No details for this ISBN");
    expect(calls).toHaveLength(0);
    expect(seen.map((d) => [d.isbn13, d.isbn10])).toEqual([["9780306406157", "0306406152"], ["9780804429573", "080442957X"]]);
    expect(seen[0].signal).toBeInstanceOf(AbortSignal);
  });

  test("Copy fires a cancelable tc-copy and shows a check", async () => {
    const el = await make({ resolve: resolver([]) });
    const seen: IsbnCopyDetail[] = [];
    el.addEventListener("tc-copy", (e) => {
      seen.push((e as CustomEvent<IsbnCopyDetail>).detail);
      e.preventDefault();
    });
    marksOf(el)[1].focus();
    await opened(el);
    card(el)!.querySelector<HTMLButtonElement>('[aria-label="Copy ISBN-10"]')!.click();
    card(el)!.querySelector<HTMLButtonElement>('[aria-label="Copy ISBN-13"]')!.click();
    expect(seen).toEqual([{ text: "080442957X", form: "isbn10" }, { text: "9780804429573", form: "isbn13" }]);
    // Prevented: no clipboard write, no check
    await el.updateComplete;
    expect(card(el)!.querySelector(".ui-isbn__copy[data-done]")).toBeNull();
  });

  test("leaving the page aborts lookups in flight; a text change closes a card whose ISBN went away", async () => {
    const calls: Calls = [];
    const el = await make({ resolve: resolver(calls, BOOKS, 500) });
    marksOf(el)[0].focus();
    await ready(el);
    const host = el.parentElement!;
    el.remove();
    expect(calls[0].signal.aborted).toBe(true);
    host.append(el);
    await el.updateComplete;
    el.text = "Nothing here any more: 0306406153.";
    await el.updateComplete;
    expect(marksOf(el)).toHaveLength(0);
    expect(card(el)).toBeNull();
  });

  test("the wrapper: resolve and onCopy (false stops the clipboard write); a parent re-render keeps the card's cache", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const rootEl = createRoot(host);
    const calls: Calls = [];
    const copies: string[] = [];
    const resolve = resolver(calls);
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(IsbnDetails, { text: TEXT, className: `n${n}`, resolve, hoverDelay: 60, onCopy: (text: string) => (copies.push(text), false) });
    }
    await act(async () => rootEl.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcIsbnDetails>("tc-isbn-details")!;
    marksOf(el)[0].focus();
    await act(async () => opened(el));
    card(el)!.querySelector<HTMLButtonElement>('[aria-label="Copy ISBN-13"]')!.click();
    expect(copies).toEqual(["9780306406157"]);
    await act(async () => rerender(1));
    await settle();
    marksOf(el)[0].blur();
    marksOf(el)[0].focus();
    await act(async () => opened(el));
    expect(calls).toHaveLength(1);
    await act(async () => rootEl.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look, with a book, an error and no details open (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-isbn-details hover-delay="0" .text=${TEXT} .resolve=${resolver([])}></tc-isbn-details>
        <tc-isbn-details hover-delay="0" look="clean" .text=${TEXT} .resolve=${() => Promise.reject(new Error("down"))}></tc-isbn-details>
        <tc-isbn-details hover-delay="0" look="clean" .text=${TEXT}></tc-isbn-details>
      </div>`);
      const els = [...wrap.querySelectorAll<TcIsbnDetails>("tc-isbn-details")];
      els.forEach((el, i) => marksOf(el)[i === 0 ? 0 : 2].dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 })));
      await expect.poll(() => els.map((el) => card(el)?.dataset.status), { timeout: 3000 }).toEqual(["done", "error", "empty"]);
      await settle(wrap);
      expect(els.map((el) => card(el)?.dataset.status)).toEqual(["done", "error", "empty"]);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
