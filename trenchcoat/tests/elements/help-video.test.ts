/*
 * <tc-help-video> in real browsers: the icon, its name, size, label and tooltip, opening the player, files, embeds and
 * nothing to play, chapters, watching to the end, Watch again and Done, closing and focus, cancelable events, the
 * React wrapper and axe in both looks and both themes – with the player open too.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/help-video";
import { helpVideoTime, type HelpVideoOpenChange, type HelpVideoWatchedChange, type TcHelpVideo } from "../../src/elements/help-video";
import { HelpVideo } from "../../src/elements/react/help-video";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SRC = "data:video/mp4;base64,";
const CHAPTERS = [
  { time: 0, title: "Sort by risk" },
  { time: 48, title: "Take an alert" },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const help = () =>
  fixture<TcHelpVideo>(
    html`<tc-help-video heading="Triage the queue" duration="125" src=${SRC} captions="data:text/vtt,WEBVTT" description="Sort new alerts by risk." .chapters=${CHAPTERS} .autoplay=${false}></tc-help-video>`,
  );
const trigger = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-hvd__trigger")!;
const dialog = (el: Element) => el.querySelector<HTMLDialogElement>(".ui-hvd__dialog")!;

describe("tc-help-video", () => {
  for (const look of ["standard", "clean"]) {
    test(`renders in ${look}: one button with the film cell, named after the video`, async () => {
      const wrap = await fixture<HTMLElement>(html`<div><tc-help-video look=${look} heading="Triage the queue" duration="125" src=${SRC}></tc-help-video></div>`);
      const el = wrap.querySelector<TcHelpVideo>("tc-help-video")!;
      expect(el.dataset.ui).toBe("hvd");
      expect(el.dataset.look).toBe(look);
      const b = trigger(el);
      expect(b.getAttribute("aria-haspopup")).toBe("dialog");
      expect(text(b.querySelector(".tc-sr-only"))).toBe("Watch video: Triage the queue, 2:05");
      expect(b.querySelectorAll(".ui-hvd__icon mask rect")).toHaveLength(9);
      expect(text(b.querySelector(".ui-hvd__tip"))).toBe("Triage the queue · 2:05");
      expect(b.querySelector(".ui-hvd__seen")).toBeNull();
      expect(dialog(el).open).toBe(false);
      expect(el.querySelectorAll("button")).toHaveLength(1);
    });
  }

  test("sizes follow the text, a label replaces the tooltip, and watched adds a check", async () => {
    const el = await fixture<HTMLElement>(html`<div style="font-size: 20px">
      <tc-help-video heading="A" size="sm"></tc-help-video><tc-help-video heading="B"></tc-help-video><tc-help-video heading="C" size="lg"></tc-help-video>
      <tc-help-video heading="Export the trail" label="Watch how" watched></tc-help-video>
    </div>`);
    const [sm, md, lg, labelled] = [...el.querySelectorAll<TcHelpVideo>("tc-help-video")];
    const size = (x: Element) => x.querySelector(".ui-hvd__mark")!.getBoundingClientRect().width;
    expect(size(sm!)).toBeCloseTo(20, 0);
    expect(size(md!)).toBeCloseTo(25, 0);
    expect(size(lg!)).toBeCloseTo(30, 0);
    expect(trigger(sm!).getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    expect(text(labelled!.querySelector(".ui-hvd__label"))).toBe("Watch how");
    expect(labelled!.querySelector(".ui-hvd__tip")).toBeNull();
    expect(text(trigger(labelled!))).toBe("Watch how : Export the trail, Watched");
    expect(labelled!.querySelector(".ui-hvd__seen")).toBeTruthy();
    // Two on a page don't share a mask
    const masks = [...el.querySelectorAll("mask")].map((m) => m.id);
    expect(new Set(masks).size).toBe(4);
  });

  test("times read m:ss, or h:mm:ss past an hour", () => {
    expect(helpVideoTime(0)).toBe("0:00");
    expect(helpVideoTime(65.4)).toBe("1:05");
    expect(helpVideoTime(3725)).toBe("1:02:05");
    expect(helpVideoTime(-3)).toBe("0:00");
  });

  test("a click opens the player with the file, captions, description and chapters; Close returns focus", async () => {
    const el = await help();
    const seen: HelpVideoOpenChange[] = [];
    el.addEventListener("tc-open-change", (e) => seen.push((e as CustomEvent<HelpVideoOpenChange>).detail));
    trigger(el).focus();
    trigger(el).click();
    await settle();
    expect(seen).toEqual([{ open: true }]);
    expect(el.open).toBe(true);
    expect(el.hasAttribute("open")).toBe(true);
    const d = dialog(el);
    expect(d.open).toBe(true);
    expect(document.getElementById(d.getAttribute("aria-labelledby")!)!.textContent).toBe("Triage the queue");
    expect(document.getElementById(d.getAttribute("aria-describedby")!)!.textContent).toBe("Sort new alerts by risk.");
    expect(text(el.querySelector(".ui-hvd__kicker"))).toBe("Help video · 2:05");
    const video = el.player!;
    expect(video.controls).toBe(true);
    expect(video.querySelector("source")!.getAttribute("src")).toBe(SRC);
    expect(video.querySelector("track")!.getAttribute("kind")).toBe("captions");
    expect(document.activeElement).toBe(video);
    expect([...el.querySelectorAll(".ui-hvd__chapter")].map(text)).toEqual(["0:00 Sort by risk", "0:48 Take an alert"]);
    el.querySelector<HTMLButtonElement>(".ui-hvd__close")!.click();
    await settle();
    expect(el.open).toBe(false);
    expect(dialog(el).open).toBe(false);
    expect(el.player).toBeNull();
    expect(seen[1]).toEqual({ open: false });
    await expect.poll(() => document.activeElement).toBe(trigger(el));
  });

  test("Escape and a click on the backdrop close the player", async () => {
    const el = await help();
    el.open = true;
    await settle();
    dialog(el).dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();
    expect(el.open).toBe(false);
    el.open = true;
    await settle();
    dialog(el).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(el.open).toBe(false);
  });

  test("chapters follow where the video is", async () => {
    const el = await help();
    el.open = true;
    await settle();
    const video = el.player!;
    expect(el.querySelectorAll(".ui-hvd__chapter")[0]!.getAttribute("aria-current")).toBe("true");
    Object.defineProperty(video, "currentTime", { configurable: true, get: () => 50, set: () => {} });
    video.dispatchEvent(new Event("timeupdate"));
    await settle();
    expect(el.querySelectorAll(".ui-hvd__chapter")[1]!.getAttribute("aria-current")).toBe("true");
    expect(el.querySelectorAll(".ui-hvd__chapter")[0]!.getAttribute("aria-current")).toBe("false");
  });

  test("played to its end it's watched and announced, with Watch again and Done", async () => {
    const el = await help();
    const seen: HelpVideoWatchedChange[] = [];
    el.addEventListener("tc-watched-change", (e) => seen.push((e as CustomEvent<HelpVideoWatchedChange>).detail));
    el.open = true;
    await settle();
    el.player!.dispatchEvent(new Event("ended"));
    await settle();
    expect(seen).toEqual([{ watched: true }]);
    expect(el.watched).toBe(true);
    expect(el.hasAttribute("watched")).toBe(true);
    expect(text(el.querySelector('[role="status"]'))).toBe("Watched: Triage the queue");
    expect(text(el.querySelector(".ui-hvd__done"))).toBe("Finished");
    expect(text(el.querySelector(".ui-hvd__kicker"))).toBe("Help video · 2:05 · Watched");
    el.querySelector<HTMLButtonElement>(".ui-hvd__again")!.click();
    await settle();
    expect(el.querySelector(".ui-hvd__end")).toBeNull();
    el.player!.dispatchEvent(new Event("ended"));
    await settle();
    expect(seen).toHaveLength(1);
    el.querySelector<HTMLButtonElement>(".ui-hvd__finish")!.click();
    await settle();
    expect(el.open).toBe(false);
    expect(trigger(el).querySelector(".ui-hvd__seen")).toBeTruthy();
    expect(text(trigger(el).querySelector(".tc-sr-only"))).toBe("Watch video: Triage the queue, 2:05, Watched");
  });

  test("an embed plays in a named iframe; with nothing to play it says so", async () => {
    const el = await fixture<TcHelpVideo>(html`<tc-help-video heading="Export the trail" embed="about:blank" .chapters=${CHAPTERS}></tc-help-video>`);
    el.open = true;
    await settle();
    expect(el.querySelector("iframe")!.title).toBe("Export the trail");
    expect(el.player).toBeNull();
    expect(el.querySelector(".ui-hvd__chapters")).toBeNull();
    expect(text(el.querySelector(".ui-hvd__kicker"))).toBe("Help video");
    el.embed = undefined;
    await settle();
    expect(text(el.querySelector(".ui-hvd__unavailable"))).toBe("This video can't be played here.");
    expect(dialog(el).hasAttribute("aria-describedby")).toBe(false);
  });

  test("prevented events keep the state, and renamed words show", async () => {
    const el = await help();
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    trigger(el).click();
    await settle();
    expect(el.open).toBe(false);
    expect(dialog(el).open).toBe(false);
    const other = await fixture<TcHelpVideo>(html`<tc-help-video heading="Queue" src=${SRC} .autoplay=${false} .labels=${{ watch: "Play", kicker: "Tutorial" }}></tc-help-video>`);
    other.addEventListener("tc-watched-change", (e) => e.preventDefault());
    expect(text(trigger(other).querySelector(".tc-sr-only"))).toBe("Play: Queue");
    other.open = true;
    await settle();
    expect(text(other.querySelector(".ui-hvd__kicker"))).toBe("Tutorial");
    other.player!.dispatchEvent(new Event("ended"));
    await settle();
    expect(other.watched).toBe(false);
  });
});

describe("React", () => {
  test("uncontrolled watched survives re-renders, and a controlled open stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = (extra = {}) => React.createElement(HelpVideo, { title: "Queue", src: SRC, autoplay: false, ...extra });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcHelpVideo>("tc-help-video")!;
    expect(el.heading).toBe("Queue");
    await act(async () => trigger(el).click());
    await settle();
    await act(async () => el.player!.dispatchEvent(new Event("ended")));
    await act(async () => root.render(node()));
    await settle();
    expect(el.watched).toBe(true);
    let asked: boolean | undefined;
    await act(async () => root.render(node({ open: false, onOpenChange: (o: boolean) => (asked = o) })));
    await settle();
    expect(el.open).toBe(false);
    await act(async () => trigger(el).click());
    await settle();
    expect(asked).toBe(true);
    expect(el.open).toBe(false);
    await act(async () => root.render(node({ open: true })));
    await settle();
    expect(dialog(el).open).toBe(true);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(
          html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas; color: CanvasText`}>
            <h2>Alert queue <tc-help-video look=${look} heading="Triage the queue" duration="125"></tc-help-video></h2>
            <p>Export <tc-help-video look=${look} heading="Export the trail" label="Watch how" size="sm" watched></tc-help-video></p>
          </div>`,
        );
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }

  test("no axe violations with the player open", async () => {
    const el = await help();
    el.open = true;
    await settle();
    el.player!.dispatchEvent(new Event("ended"));
    await finish(el);
    const { violations } = await axe.run(dialog(el));
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  });
});
