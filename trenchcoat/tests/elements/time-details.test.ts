/*
 * <tc-time-details> in real browsers: findTimes (24- and 12-hour times, zone names and offsets, ISO stamps, dates,
 * ranges, daylight saving, and the lookalikes that stay plain), the marks, the tooltip by focus, hover and click, the
 * reader's zone and day, labels, text changing under an open tooltip, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/time-details";
import { findTimes, type TcTimeDetails, type TimeMatch, type TimeOpenChange } from "../../src/elements/time-details";
import { TimeDetails } from "../../src/elements/react/time-details";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => cleanup());

const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const DATE = "2026-11-08";
const iso = (m: TimeMatch) => new Date(m.at).toISOString().slice(0, 16);
const found = (t: string, date = DATE) => findTimes(t, { date }).map((m) => `${m.text}=${iso(m)}`);

describe("findTimes", () => {
  test("24-hour times with UTC, GMT, Z and offsets", () => {
    expect(found("Starts 06:00 UTC, ends 07:15:30 GMT; backup at 23:00Z; Lagos 14:00 GMT+1, Recife 09:00 UTC−3, Delhi 11:30 UTC+5:30.")).toEqual([
      "06:00 UTC=2026-11-08T06:00",
      "07:15:30 GMT=2026-11-08T07:15",
      "23:00Z=2026-11-08T23:00",
      "14:00 GMT+1=2026-11-08T13:00",
      "09:00 UTC−3=2026-11-08T12:00",
      "11:30 UTC+5:30=2026-11-08T06:00",
    ]);
    const [m] = findTimes("at 14:00 GMT+1", { date: DATE });
    expect([m.zone, m.offset, m.dated]).toEqual(["GMT+1", 60, false]);
  });

  test("12-hour times and zone names; generic US names follow daylight saving on the date", () => {
    expect(found("9 am ET, 6:30 PM PST, 16:00 CET, 18:00 CEST, 9am JST, 12:15 a.m. EST")).toEqual([
      "9 am ET=2026-11-08T14:00",
      "6:30 PM PST=2026-11-09T02:30",
      "16:00 CET=2026-11-08T15:00",
      "18:00 CEST=2026-11-08T16:00",
      "9am JST=2026-11-08T00:00",
      "12:15 a.m. EST=2026-11-08T05:15",
    ]);
    expect(found("9 am PT", "2026-07-01")).toEqual(["9 am PT=2026-07-01T16:00"]);
    expect(found("9 am PT", "2026-11-08")).toEqual(["9 am PT=2026-11-08T17:00"]);
  });

  test("ISO stamps and an ISO date before a time are dated", () => {
    const m = findTimes("Fallback 2026-11-09 22:00 UTC; logged 2026-11-08T11:30:00+05:30 and 2026-11-08T06:00:00.000Z.", { date: DATE });
    expect(m.map((x) => `${x.text}=${iso(x)}`)).toEqual([
      "2026-11-09 22:00 UTC=2026-11-09T22:00",
      "2026-11-08T11:30:00+05:30=2026-11-08T06:00",
      "2026-11-08T06:00:00.000Z=2026-11-08T06:00",
    ]);
    expect(m.map((x) => [x.zone, x.dated])).toEqual([
      ["UTC", true],
      ["+05:30", true],
      ["Z", true],
    ]);
  });

  test("ranges: the start takes the end's zone (and am/pm when it has none)", () => {
    expect(found("Read-only 05:30–09:00 UTC, office hours 9–11 am PT, and 10 am to 2 pm ET.")).toEqual([
      "05:30=2026-11-08T05:30",
      "09:00 UTC=2026-11-08T09:00",
      "9=2026-11-08T17:00",
      "11 am PT=2026-11-08T19:00",
      "10 am=2026-11-08T15:00",
      "2 pm ET=2026-11-08T19:00",
    ]);
  });

  test("lookalikes stay plain: no zone, a bare hour, lower-case names, versions, rooms, dates, impossible times", () => {
    expect(found("Done by 07:30; at 6 UTC; 6 pm et al.; 10:30 utc; v2.4.1 UTC; room 14-10; 2026-11-08; 25:00 UTC; 12:61 UTC; 13 pm ET; IST 10:00 IST; 1:2:06:00 UTC")).toEqual([]);
  });

  test("without a date, bare times fall on today in their own zone", () => {
    const now = Date.UTC(2026, 10, 8, 20, 0); // 05:00 on the 9th in Tokyo
    expect(findTimes("06:00 UTC and 23:30 JST", { now }).map(iso)).toEqual(["2026-11-08T06:00", "2026-11-09T14:30"]);
  });
});

/* ---------- The element ---------- */

const TEXT = "Rebuild at 06:00 UTC, done by 07:30.\nRead-only 05:30–09:00 UTC; fallback 2026-11-09 22:00 UTC; late call 02:00 UTC.";
const make = (o: { look?: string; zone?: string; text?: string } = {}) =>
  fixture<TcTimeDetails>(
    html`<tc-time-details style="width: 520px; margin-top: 120px" look=${o.look ?? "standard"} hover-delay="40" locale="en-US" time-zone=${o.zone ?? "America/New_York"} date=${DATE} .text=${o.text ?? TEXT}></tc-time-details>`,
  );
const marksOf = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-tmd__mark")];
const tip = (el: Element) => el.querySelector<HTMLElement>(".ui-tmd__pop");
const described = (m: HTMLElement) => plain(document.getElementById(m.getAttribute("aria-describedby")!)?.textContent);
const shown = async (el: TcTimeDetails) => {
  await expect.poll(() => !!tip(el)?.hasAttribute("data-placed"), { timeout: 3000 }).toBe(true);
  return tip(el)!;
};

describe("tc-time-details", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: each time with a zone becomes a focusable <time>; the text is unchanged`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("tmd");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-tmd__text")!.textContent).toBe(TEXT);
      const ms = marksOf(el);
      expect(ms.map((m) => m.textContent)).toEqual(["06:00 UTC", "05:30", "09:00 UTC", "2026-11-09 22:00 UTC", "02:00 UTC"]);
      expect(ms.every((m) => m.tagName === "TIME" && m.tabIndex === 0)).toBe(true);
      expect(ms[0].getAttribute("datetime")).toBe("2026-11-08T06:00:00.000Z");
      expect(tip(el)).toBeNull();
    });
  }

  test("each mark is described by its local time, with the date when written or when the day changes", async () => {
    const el = await make();
    const ms = marksOf(el);
    expect(described(ms[0])).toBe("Your local time: 1:00 AM EST");
    expect(described(ms[3])).toBe("Your local time: 5:00 PM EST, Monday, November 9");
    expect(described(ms[4])).toBe("Your local time: 9:00 PM EST, Saturday, November 7, the day before");
  });

  test("focus opens the tooltip; Escape closes it; tc-open-change says which", async () => {
    const el = await make();
    const seen: (string | null)[] = [];
    el.addEventListener("tc-open-change", (e) => seen.push((e as CustomEvent<TimeOpenChange>).detail.open?.text ?? null));
    marksOf(el)[0].focus();
    const t = await shown(el);
    expect(plain(t.textContent)).toBe("Your local time 1:00 AM EST");
    expect(t.getAttribute("role")).toBe("tooltip");
    expect(marksOf(el)[0].hasAttribute("data-open")).toBe(true);
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => tip(el)).toBeNull();
    expect(document.activeElement).toBe(marksOf(el)[0]);
    expect(seen).toEqual(["06:00 UTC", null]);
  });

  test("the day line: the reader's day before, the next day, and a written date", async () => {
    const el = await make();
    marksOf(el)[4].focus();
    expect(plain((await shown(el)).querySelector(".ui-tmd__date")!.textContent)).toBe("Saturday, November 7 · The day before");
    const tokyo = await make({ zone: "Asia/Tokyo", text: "Call at 20:00 UTC." });
    marksOf(tokyo)[0].focus();
    const t = await shown(tokyo);
    expect(plain(t.querySelector(".ui-tmd__time")!.textContent)).toBe("5:00 AM GMT+9");
    expect(plain(t.querySelector(".ui-tmd__date")!.textContent)).toBe("Monday, November 9 · The next day");
  });

  test("in the zone it was written in: “Your time zone too”, and no date line", async () => {
    const el = await make({ zone: "UTC", text: "At 06:00 UTC." });
    marksOf(el)[0].focus();
    const t = await shown(el);
    expect(plain(t.querySelector(".ui-tmd__time")!.textContent)).toBe("6:00 AM UTC");
    expect(t.querySelector(".ui-tmd__same")).not.toBeNull();
    expect(t.querySelector(".ui-tmd__date")).toBeNull();
  });

  test("hover opens after the delay; a click pins it and a second click closes it", async () => {
    const el = await make();
    const m = marksOf(el)[1];
    await userEvent.hover(m);
    expect(plain((await shown(el)).querySelector(".ui-tmd__time")!.textContent)).toBe("12:30 AM EST");
    m.click();
    await settle(el);
    expect(tip(el)).not.toBeNull();
    m.click();
    await expect.poll(() => tip(el)).toBeNull();
  });

  test("openCard() and closeCard()", async () => {
    const el = await make();
    el.openCard(2);
    expect(plain((await shown(el)).querySelector(".ui-tmd__time")!.textContent)).toBe("4:00 AM EST");
    el.closeCard();
    await expect.poll(() => tip(el)).toBeNull();
  });

  test("labels and locale reword it", async () => {
    const el = await fixture<TcTimeDetails>(
      html`<tc-time-details locale="de-DE" time-zone="Europe/Berlin" date=${DATE} .labels=${{ yours: "Bei dir", before: "Am Vortag" }} text="Um 23:30 EST."></tc-time-details>`,
    );
    // 23:30 EST on the 8th is 05:30 on the 9th in Berlin; "after" isn't renamed, so it keeps the default words
    expect(described(marksOf(el)[0])).toBe("Bei dir: 05:30 MEZ, Montag, 9. November, the next day");
  });

  test("an unknown time-zone falls back to the browser's", async () => {
    const el = await make({ zone: "Mars/Olympus_Mons" });
    expect(described(marksOf(el)[0])).toMatch(/^Your local time: \d{1,2}:00/);
  });

  test("text changing under an open tooltip closes it when its time went away", async () => {
    const el = await make();
    marksOf(el)[0].focus();
    await shown(el);
    el.text = "Nothing to see here.";
    await settle(el);
    expect(tip(el)).toBeNull();
    expect(marksOf(el)).toHaveLength(0);
  });

  test("now picks today when no date is given", async () => {
    const el = await fixture<TcTimeDetails>(html`<tc-time-details locale="en-US" time-zone="UTC" .now=${Date.UTC(2026, 0, 15, 12)} text="At 06:00 UTC."></tc-time-details>`);
    expect(marksOf(el)[0].getAttribute("datetime")).toBe("2026-01-15T06:00:00.000Z");
  });

  test("React: onOpenChange and props pass through", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: (string | null)[] = [];
    await act(async () =>
      root.render(React.createElement(TimeDetails, { text: "Go at 06:00 UTC.", date: DATE, timeZone: "America/New_York", locale: "en-US", onOpenChange: (m) => seen.push(m?.text ?? null) })),
    );
    await settle();
    const el = host.querySelector<TcTimeDetails>("tc-time-details")!;
    expect(described(marksOf(el)[0])).toBe("Your local time: 1:00 AM EST");
    marksOf(el)[0].focus();
    await act(async () => void (await shown(el)));
    el.closeCard();
    await act(async () => settle());
    expect(seen).toEqual(["06:00 UTC", null]);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look, tooltip open (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${`padding-top: 120px;${theme === "dark" ? " background: #0e0e10; color-scheme: dark" : ""}`}>
        <tc-time-details locale="en-US" time-zone="America/New_York" date=${DATE} .text=${TEXT}></tc-time-details>
        <tc-time-details look="clean" locale="en-US" time-zone="America/New_York" date=${DATE} .text=${TEXT}></tc-time-details>
      </div>`);
      const els = [...wrap.querySelectorAll<TcTimeDetails>("tc-time-details")];
      els[1].openCard(3);
      await shown(els[1]);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
