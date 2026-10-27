/*
 * <tc-transcript-review> in real browsers – the segments listbox following playback, seeking from the list and the
 * waveform, the keyboard (Space, J K L, arrows, Enter, C, V), search with waveform ticks, the speaker filter, the
 * translation views, Send to verification and Copy, auto-follow and "Back to now", the speaker announcement, the
 * media (made from src, passed in, video, a load error), windowing with 5,000 segments, reduced motion, the React
 * wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/transcript-review";
import type {
  TcTranscriptReview,
  TranscriptCopyDetail,
  TranscriptHiddenSpeakersChange,
  TranscriptQueryChange,
  TranscriptSegment,
  TranscriptSegmentChange,
  TranscriptSpeaker,
  TranscriptTranslationModeChange,
  TranscriptVerifyDetail,
} from "../../src/elements/transcript-review";
import { transcriptClock } from "../../src/elements/transcript-review";
import { TranscriptReview } from "../../src/elements/react/transcript-review";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const SPEAKERS: TranscriptSpeaker[] = [
  { id: "a", name: "Ana Ruiz" },
  { id: "b", name: "Ben Ode", tone: "teal" },
];
const SEGS: TranscriptSegment[] = [
  { id: "s1", start: 0.5, end: 4, speaker: "a", text: "Hola, buenos días.", translation: "Hello, good morning.", confidence: 0.95, translationConfidence: 0.9 },
  { id: "s2", start: 4.5, end: 9, speaker: "b", text: "El pedido no llegó.", translation: "The order didn't arrive.", confidence: 0.55, translationConfidence: 0.6 },
  {
    id: "s3",
    start: 9.5,
    end: 14,
    speaker: "a",
    text: "Termina en ochenta y dos.",
    translation: "It ends in eighty-two.",
    confidence: 0.82,
    words: [{ text: "Termina", confidence: 0.9 }, { text: "en" }, { text: "ochenta", confidence: 0.4 }, { text: "y" }, { text: "dos.", confidence: 0.5 }],
  },
  { id: "s4", start: 15, end: 20, speaker: "b", text: "Gracias por el pedido.", translation: "Thanks for the order.", confidence: 0.9 },
];
const PEAKS = Array.from({ length: 200 }, (_, i) => Math.abs(Math.sin(i / 7)));

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-tsr__row:not([data-float])")];
const ids = (el: Element) => rows(el).map((r) => r.dataset.id);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-tsr__row[data-id="${id}"]`)!;
const wave = (el: Element) => el.querySelector<HTMLElement>(".ui-tsr__wave")!;
const said = (el: Element) => text(el.querySelector('.ui-tsr__sr[role="status"]'));
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const make = (extra: Partial<TcTranscriptReview> = {}) =>
  fixture<TcTranscriptReview>(html`<tc-transcript-review .segments=${SEGS} .speakers=${SPEAKERS} .peaks=${PEAKS} duration="20" .threshold=${0.7}></tc-transcript-review>`).then(async (el) => {
    Object.assign(el, extra);
    await settle();
    return el;
  });

/** An <audio> whose clock and play state the test drives: no decoding, no autoplay policy */
function fakeMedia() {
  const audio = document.createElement("audio");
  let t = 0;
  let paused = true;
  const calls = { play: 0, pause: 0 };
  Object.defineProperty(audio, "currentTime", { configurable: true, get: () => t, set: (v: number) => ((t = v), audio.dispatchEvent(new Event("timeupdate"))) });
  Object.defineProperty(audio, "paused", { configurable: true, get: () => paused });
  audio.play = () => {
    calls.play++;
    paused = false;
    audio.dispatchEvent(new Event("play"));
    return Promise.resolve();
  };
  audio.pause = () => {
    calls.pause++;
    paused = true;
    audio.dispatchEvent(new Event("pause"));
  };
  return { audio, calls, at: (v: number) => (audio.currentTime = v) };
}

/** A short silent WAV as a data URI */
function wav(seconds: number) {
  const rate = 8000;
  const n = Math.round(seconds * rate);
  const bytes = new Uint8Array(44 + n).fill(128);
  const v = new DataView(bytes.buffer);
  const s = (at: number, x: string) => [...x].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  s(0, "RIFF");
  v.setUint32(4, 36 + n, true);
  s(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  s(36, "data");
  v.setUint32(40, n, true);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

describe("tc-transcript-review", () => {
  test("the host is a region named by the heading; the header gives the length, the speakers and the low-confidence count", async () => {
    const el = await make();
    expect(el.dataset.ui).toBe("tsr");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Transcript");
    expect(el.querySelector("h3.tc-head__title")!.textContent).toBe("Transcript");
    expect(text(el.querySelector(".tc-head__sub"))).toBe("0:20 · 2 speakers");
    expect(text(el.querySelector(".ui-tsr__pill"))).toBe("1 low confidence");
    el.heading = "Call";
    el.description = "Partner feed";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Call");
    expect(text(el.querySelector(".tc-head__sub"))).toBe("Partner feed");
  });

  test("the segments are a listbox of options with timestamps, speaker chips and what's uncertain", async () => {
    const el = await make();
    const list = el.querySelector(".ui-tsr__rows")!;
    expect(list.getAttribute("role")).toBe("listbox");
    expect(list.getAttribute("aria-label")).toBe("Segments");
    expect(ids(el)).toEqual(["s1", "s2", "s3", "s4"]);
    const r2 = row(el, "s2");
    expect(r2.getAttribute("role")).toBe("option");
    expect(r2.getAttribute("aria-setsize")).toBe("4");
    expect(r2.getAttribute("aria-posinset")).toBe("2");
    expect(text(r2.querySelector(".ui-tsr__time"))).toBe("00:04");
    expect(text(r2.querySelector(".ui-tsr__chip"))).toBe("BO");
    expect(r2.querySelector(".ui-tsr__chip")!.getAttribute("data-tone")).toBe("teal");
    expect(row(el, "s1").querySelector(".ui-tsr__chip")!.getAttribute("data-tone")).toBe("blue");
    expect(r2.hasAttribute("data-low")).toBe(true);
    expect(text(r2.querySelector(".ui-tsr__flag"))).toBe("55%");
    expect(text(r2)).toBe("00:04 55% BO Ben Ode: El pedido no llegó. , low confidence 55%");
    // Words below the threshold are underlined; the row says how many
    expect([...row(el, "s3").querySelectorAll(".ui-tsr__lw")].map(text)).toEqual(["ochenta", "dos."]);
    expect(text(row(el, "s3"))).toContain(", 2 uncertain words");
    // The first row holds the tab stop until playback reaches a segment
    expect(rows(el).map((r) => r.tabIndex)).toEqual([0, -1, -1, -1]);
    expect(transcriptClock(3725)).toBe("1:02:05");
  });

  test("seek(): the playing segment is selected and marked, tc-segment-change fires, the slider and playhead follow", async () => {
    const el = await make();
    const seen: (string | null)[] = [];
    el.addEventListener("tc-segment-change", (e) => seen.push((e as CustomEvent<TranscriptSegmentChange>).detail.segment?.id ?? null));
    el.seek(10);
    await settle();
    expect(el.currentSegment?.id).toBe("s3");
    expect(row(el, "s3").getAttribute("aria-selected")).toBe("true");
    expect(row(el, "s3").hasAttribute("data-playing")).toBe(true);
    expect(row(el, "s1").getAttribute("aria-selected")).toBe("false");
    expect(wave(el).getAttribute("aria-valuenow")).toBe("10");
    expect(wave(el).getAttribute("aria-valuetext")).toBe("0:10 of 0:20, Ana Ruiz");
    expect(wave(el).style.getPropertyValue("--at")).toBe("0.5");
    expect(text(el.querySelector(".ui-tsr__clock"))).toBe("0:10 / 0:20");
    // A gap between segments: nothing plays, the selection stays
    el.seek(14.5);
    await settle();
    expect(el.currentSegment).toBeNull();
    expect(row(el, "s3").getAttribute("aria-selected")).toBe("true");
    expect(row(el, "s3").hasAttribute("data-playing")).toBe(false);
    expect(seen).toEqual(["s3", null]);
    // The footer names the selected segment and its confidence
    expect(text(el.querySelector(".ui-tsr__seg"))).toBe("AR 00:09–00:14 Ana Ruiz · Recognition 82%");
  });

  test("clicking a segment seeks to it and focuses it", async () => {
    const el = await make();
    row(el, "s4").click();
    await settle();
    expect(el.currentSegment?.id).toBe("s4");
    expect(document.activeElement).toBe(row(el, "s4"));
    expect(row(el, "s4").tabIndex).toBe(0);
  });

  test("the list's keys: ↑ ↓ ← → step segments, Home End, Enter plays from one", async () => {
    const el = await make();
    const m = fakeMedia();
    el.media = m.audio;
    await settle();
    row(el, "s1").focus();
    await key(row(el, "s1"), "ArrowDown");
    expect(el.currentSegment?.id).toBe("s2");
    expect(document.activeElement).toBe(row(el, "s2"));
    await key(row(el, "s2"), "ArrowRight");
    expect(document.activeElement).toBe(row(el, "s3"));
    await key(row(el, "s3"), "ArrowLeft");
    expect(document.activeElement).toBe(row(el, "s2"));
    await key(row(el, "s2"), "End");
    expect(document.activeElement).toBe(row(el, "s4"));
    await key(row(el, "s4"), "ArrowDown");
    expect(document.activeElement).toBe(row(el, "s4"));
    await key(row(el, "s4"), "Home");
    expect(document.activeElement).toBe(row(el, "s1"));
    expect(m.audio.currentTime).toBeCloseTo(0.5, 2);
    await key(row(el, "s1"), "ArrowUp");
    expect(document.activeElement).toBe(row(el, "s1"));
    await key(row(el, "s1"), "Enter");
    expect(m.calls.play).toBe(1);
    // Modifier keys are left alone
    await key(row(el, "s1"), "ArrowDown", { ctrlKey: true });
    expect(el.currentSegment?.id).toBe("s1");
  });

  test("J K L: back, play or pause, forward; Space plays and pauses on the waveform only", async () => {
    const el = await make({ skip: 3 });
    const m = fakeMedia();
    el.media = m.audio;
    await settle();
    m.at(10);
    await settle();
    await key(row(el, "s1"), "l");
    expect(m.audio.currentTime).toBe(13);
    await key(row(el, "s1"), "j");
    expect(m.audio.currentTime).toBe(10);
    await key(row(el, "s1"), "k");
    expect(m.calls.play).toBe(1);
    expect(el.querySelector(".ui-tsr__play")!.getAttribute("aria-label")).toBe("Pause");
    await key(row(el, "s1"), "K");
    expect(m.calls.pause).toBe(1);
    expect(el.querySelector(".ui-tsr__play")!.getAttribute("aria-label")).toBe("Play");
    // Space on a row doesn't play; on the waveform it does
    await key(row(el, "s1"), " ");
    expect(m.calls.play).toBe(1);
    wave(el).focus();
    await key(wave(el), " ");
    expect(m.calls.play).toBe(2);
    await key(wave(el), " ");
    expect(m.calls.pause).toBe(2);
    // Keys typed in the search field are text, not shortcuts
    await key(el.querySelector(".ui-tsr__input")!, "k");
    expect(m.calls.play).toBe(2);
    // The buttons do the same
    el.querySelector<HTMLButtonElement>(".ui-tsr__ib[aria-keyshortcuts='L']")!.click();
    await settle();
    expect(m.audio.currentTime).toBe(13);
    expect(el.querySelector(".ui-tsr__play")!.getAttribute("aria-keyshortcuts")).toBe("K");
  });

  test("the waveform: a slider – click or drag to seek, ← → step segments, Home End; low stretches and the bars drawn", async () => {
    const el = await make();
    const w = wave(el);
    expect(w.getAttribute("role")).toBe("slider");
    expect(w.getAttribute("aria-valuemax")).toBe("20");
    expect(w.querySelectorAll(".ui-tsr__bars:not(.ui-tsr__bars--played) .ui-tsr__bar").length).toBeGreaterThan(20);
    expect(w.querySelectorAll(".ui-tsr__lowband").length).toBe(2);
    const r = w.getBoundingClientRect();
    w.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1, clientX: r.left + r.width * 0.25, clientY: r.top + 5 }));
    await settle();
    expect(el.currentSegment?.id).toBe("s2");
    w.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 1, clientX: r.left + r.width * 0.8, clientY: r.top + 5 }));
    await settle();
    expect(el.currentSegment?.id).toBe("s4");
    w.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
    w.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 1, clientX: r.left + 2, clientY: r.top + 5 }));
    await settle();
    expect(el.currentSegment?.id).toBe("s4");
    w.focus();
    await key(w, "ArrowLeft");
    expect(el.currentSegment?.id).toBe("s3");
    expect(document.activeElement).toBe(w);
    await key(w, "Home");
    expect(el.time).toBe(0);
    await key(w, "End");
    expect(el.time).toBe(20);
    await key(w, "ArrowLeft");
    expect(el.currentSegment?.id).toBe("s4");
  });

  test("search marks matches, counts them, ticks the waveform, and Enter steps through them; tc-query-change is cancelable", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-query-change", (e) => seen.push((e as CustomEvent<TranscriptQueryChange>).detail.query));
    const input = el.querySelector<HTMLInputElement>(".ui-tsr__input")!;
    input.value = "pedido";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.query).toBe("pedido");
    expect(seen).toEqual(["pedido"]);
    expect([...el.querySelectorAll(".ui-tsr__hit")].map(text)).toEqual(["pedido", "pedido"]);
    expect(text(el.querySelector(".ui-tsr__count"))).toBe("2 matches");
    expect(input.getAttribute("aria-describedby")).toBe(el.querySelector(".ui-tsr__count")!.id);
    expect(el.querySelectorAll(".ui-tsr__tick").length).toBe(2);
    await key(input, "Enter");
    expect(el.currentSegment?.id).toBe("s2");
    expect(text(el.querySelector(".ui-tsr__count"))).toBe("1 of 2 matches");
    expect(said(el)).toBe("Match 1 of 2, 00:04, Ben Ode");
    await key(input, "Enter");
    expect(el.currentSegment?.id).toBe("s4");
    await key(input, "Enter");
    expect(el.currentSegment?.id).toBe("s2");
    await key(input, "Enter", { shiftKey: true });
    expect(el.currentSegment?.id).toBe("s4");
    el.querySelector<HTMLButtonElement>(".ui-tsr__ib[aria-label='Previous match']")!.click();
    await settle();
    expect(el.currentSegment?.id).toBe("s2");
    // Case-insensitive, in the words with their own confidence too
    el.query = "OCHENTA";
    await settle();
    expect(text(el.querySelector(".ui-tsr__hit"))).toBe("ochenta");
    expect(el.querySelector(".ui-tsr__hit .ui-tsr__lw")).toBeTruthy();
    el.query = "nada";
    await settle();
    expect(text(el.querySelector(".ui-tsr__count"))).toBe("No matches");
    // Escape clears; a listener can keep the query
    await key(input, "Escape");
    expect(el.query).toBe("");
    el.addEventListener("tc-query-change", (e) => e.preventDefault());
    input.value = "x";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.query).toBe("");
    expect(input.value).toBe("");
  });

  test("speaker chips filter the list (tc-hidden-speakers-change, cancelable); focus doesn't drop to the page", async () => {
    const el = await make();
    const seen: string[][] = [];
    el.addEventListener("tc-hidden-speakers-change", (e) => seen.push((e as CustomEvent<TranscriptHiddenSpeakersChange>).detail.hiddenSpeakers));
    const chips = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-tsr__spk")];
    expect(el.querySelector(".ui-tsr__speakers")!.getAttribute("role")).toBe("group");
    expect(chips().map(text)).toEqual(["ARAna Ruiz, 2 segments", "BOBen Ode, 2 segments"]);
    expect(chips().map((c) => c.getAttribute("aria-pressed"))).toEqual(["true", "true"]);
    row(el, "s2").click();
    await settle();
    chips()[1].click();
    await settle();
    expect(seen).toEqual([["b"]]);
    expect(ids(el)).toEqual(["s1", "s3"]);
    expect(chips()[1].getAttribute("aria-pressed")).toBe("false");
    expect(el.contains(document.activeElement)).toBe(true);
    expect(row(el, "s1").getAttribute("aria-setsize")).toBe("2");
    // Stepping skips the hidden speaker
    row(el, "s1").focus();
    await key(row(el, "s1"), "ArrowDown");
    expect(el.currentSegment?.id).toBe("s3");
    chips()[0].click();
    await settle();
    expect(text(el.querySelector(".ui-tsr__empty"))).toBe("Every speaker is hidden – turn one on above.");
    el.addEventListener("tc-hidden-speakers-change", (e) => e.preventDefault());
    chips()[0].click();
    await settle();
    expect(el.hiddenSpeakers).toEqual(["b", "a"]);
  });

  test("translations: original, translation or side by side; low translation confidence is flagged; the switch is cancelable", async () => {
    const el = await make({ originalLabel: "Spanish", translationLabel: "English" });
    const modes = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-tsr__mode")];
    const seen: string[] = [];
    el.addEventListener("tc-translation-mode-change", (e) => seen.push((e as CustomEvent<TranscriptTranslationModeChange>).detail.mode));
    expect(modes().map(text)).toEqual(["Spanish", "English", "Side by side"]);
    expect(modes()[0].getAttribute("aria-pressed")).toBe("true");
    expect(text(row(el, "s1").querySelector(".ui-tsr__texts"))).toBe("Hola, buenos días.");
    modes()[1].click();
    await settle();
    expect(seen).toEqual(["translation"]);
    expect(text(row(el, "s1").querySelector(".ui-tsr__texts"))).toBe("Hello, good morning.");
    expect(text(row(el, "s4").querySelector(".ui-tsr__texts"))).toBe("Thanks for the order.");
    // Search follows what's shown
    el.query = "order";
    await settle();
    expect(el.querySelectorAll(".ui-tsr__hit").length).toBe(2);
    el.query = "";
    modes()[2].click();
    await settle();
    const both = row(el, "s2");
    expect(both.hasAttribute("data-both")).toBe(true);
    expect([...both.querySelectorAll(".ui-tsr__text")].map((p) => p.getAttribute("data-which"))).toEqual(["original", "translation"]);
    expect([...both.querySelectorAll(".ui-tsr__text")].map(text)).toEqual(["Spanish: El pedido no llegó.", "English: The order didn't arrive."]);
    expect(text(both)).toContain("translation confidence 60%");
    expect(text(el.querySelector(".tc-head__aside"))).toBe("1 low confidence");
    el.addEventListener("tc-translation-mode-change", (e) => e.preventDefault());
    modes()[0].click();
    await settle();
    expect(el.translationMode).toBe("both");
    // No translations, no switch
    el.segments = SEGS.map(({ translation: _t, translationConfidence: _c, ...s }) => s);
    await settle();
    expect(el.querySelector(".ui-tsr__modes")).toBeNull();
    expect(row(el, "s1").hasAttribute("data-both")).toBe(false);
  });

  test("Send to verification: a cancelable tc-verify with the segment; sent segments are marked; V sends from the list", async () => {
    const el = await make();
    const seen: TranscriptVerifyDetail[] = [];
    el.addEventListener("tc-verify", (e) => seen.push((e as CustomEvent<TranscriptVerifyDetail>).detail));
    row(el, "s2").click();
    await settle();
    const btn = () => el.querySelector<HTMLButtonElement>(".ui-tsr__act--verify")!;
    expect(text(btn())).toBe("Send to verification");
    expect(btn().getAttribute("aria-keyshortcuts")).toBe("V");
    btn().click();
    await settle();
    expect(seen.map((d) => [d.segment.id, d.sent])).toEqual([["s2", ["s2"]]]);
    expect(el.sent).toEqual(["s2"]);
    expect(text(btn())).toBe("Sent to verification");
    expect(btn().getAttribute("aria-disabled")).toBe("true");
    expect(row(el, "s2").querySelector(".ui-tsr__sent")).toBeTruthy();
    expect(said(el)).toBe("Sent the segment at 00:04 to verification");
    btn().click();
    await settle();
    expect(seen).toHaveLength(1);
    // V on a row; a listener can refuse it
    el.addEventListener("tc-verify", (e) => e.preventDefault(), { once: true });
    row(el, "s3").click();
    await settle();
    await key(row(el, "s3"), "v");
    expect(seen.at(-1)!.segment.id).toBe("s3");
    expect(el.sent).toEqual(["s2"]);
    el.verifiable = false;
    await settle();
    expect(el.querySelector(".ui-tsr__act--verify")).toBeNull();
    el.verifyLabel = "Flag";
  });

  test("Copy: tc-copy carries the text with its timestamp and speaker; preventDefault leaves the clipboard to the app", async () => {
    const el = await make();
    const seen: TranscriptCopyDetail[] = [];
    el.addEventListener("tc-copy", (e) => {
      seen.push((e as CustomEvent<TranscriptCopyDetail>).detail);
      e.preventDefault();
    });
    row(el, "s2").click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-tsr__act")!.click();
    await settle();
    expect(seen[0].segment.id).toBe("s2");
    expect(seen[0].text).toBe("[00:04–00:09] Ben Ode: El pedido no llegó.");
    expect(text(el.querySelector(".ui-tsr__act"))).toBe("Copy");
    el.translationMode = "both";
    await settle();
    await key(row(el, "s2"), "c");
    expect(seen[1].text).toBe("[00:04–00:09] Ben Ode: El pedido no llegó.\nTranslation: The order didn't arrive.");
  });

  test("auto-follow: playback scrolls the list; scrolling it yourself pauses that, and Back to now resumes", async () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ id: `f${i}`, start: i * 3, end: i * 3 + 2.5, speaker: i % 2 ? "a" : "b", text: `Line ${i} of the call.` }));
    const el = await fixture<TcTranscriptReview>(html`<tc-transcript-review .segments=${many} max-height="160"></tc-transcript-review>`);
    const list = el.querySelector<HTMLElement>(".ui-tsr__list")!;
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    el.seek(30 * 3 + 1);
    await settle();
    await new Promise((r) => setTimeout(r, 700));
    const r = row(el, "f30").getBoundingClientRect();
    const box = list.getBoundingClientRect();
    expect(r.top).toBeGreaterThanOrEqual(box.top - 1);
    expect(r.bottom).toBeLessThanOrEqual(box.bottom + 1);
    // The person scrolls: following stops, Back to now appears
    list.dispatchEvent(new WheelEvent("wheel", { bubbles: true, deltaY: -200 }));
    list.scrollTop = 0;
    await settle();
    const back = el.querySelector<HTMLButtonElement>(".ui-tsr__now-btn")!;
    expect(text(back)).toBe("Back to now");
    el.seek(35 * 3 + 1);
    await settle();
    await new Promise((r) => setTimeout(r, 300));
    expect(list.scrollTop).toBe(0);
    back.click();
    await settle();
    await new Promise((r) => setTimeout(r, 700));
    expect(el.querySelector(".ui-tsr__now-btn")).toBeNull();
    expect(list.scrollTop).toBeGreaterThan(0);
    const r35 = row(el, "f35").getBoundingClientRect();
    expect(r35.bottom).toBeLessThanOrEqual(list.getBoundingClientRect().bottom + 1);
  });

  test("reduced motion: the list jumps instead of scrolling smoothly", async () => {
    const real = window.matchMedia;
    window.matchMedia = ((q: string) => ({ ...real.call(window, q), matches: q.includes("reduce") })) as typeof window.matchMedia;
    try {
      const many = Array.from({ length: 30 }, (_, i) => ({ id: `r${i}`, start: i * 3, end: i * 3 + 2.5, speaker: "a", text: `Line ${i}.` }));
      const el = await fixture<TcTranscriptReview>(html`<tc-transcript-review .segments=${many} max-height="120"></tc-transcript-review>`);
      const list = el.querySelector<HTMLElement>(".ui-tsr__list")!;
      const calls: (ScrollBehavior | undefined)[] = [];
      const orig = list.scrollTo.bind(list);
      list.scrollTo = ((o: ScrollToOptions) => (calls.push(o.behavior), orig(o))) as typeof list.scrollTo;
      el.seek(25 * 3 + 1);
      await settle();
      expect(calls).toEqual(["auto"]);
      expect(list.scrollTop).toBeGreaterThan(0);
    } finally {
      window.matchMedia = real;
    }
  });

  test("screen readers hear the speaker when it changes during playback, politely", async () => {
    const el = await make();
    const m = fakeMedia();
    el.media = m.audio;
    await settle();
    const status = el.querySelector('.ui-tsr__sr[role="status"]')!;
    m.at(1);
    await settle();
    expect(said(el)).toBe("");
    await m.audio.play();
    m.at(5);
    await settle();
    expect(said(el)).toBe("Now speaking: Ben Ode");
    m.at(6);
    await settle();
    expect(said(el)).toBe("Now speaking: Ben Ode");
    m.at(10);
    await settle();
    expect(status.textContent).toBe("Now speaking: Ana Ruiz");
    m.audio.pause();
    await settle();
    expect(el.querySelector(".ui-tsr__play")!.getAttribute("aria-label")).toBe("Play");
  });

  test("off-screen while playing: the playhead's frame loop pauses, and resumes on return", async () => {
    const el = await make();
    const m = fakeMedia();
    el.media = m.audio;
    await settle();
    const loop = () => (el as unknown as { frame: number }).frame;
    const until = async (ok: () => boolean) => {
      for (let i = 0; i < 60 && !ok(); i++) await frame();
      return ok();
    };
    // Paused: nothing is watched
    expect(el.hasAttribute("data-offscreen")).toBe(false);
    await m.audio.play();
    await settle();
    expect(loop()).not.toBe(0);
    // Scrolled away: the attribute comes from the off-screen controller and the loop stops
    el.style.cssText = "position: fixed; top: 300vh; left: 0; width: 600px";
    expect(await until(() => el.hasAttribute("data-offscreen"))).toBe(true);
    await frame();
    expect(loop()).toBe(0);
    // The media clock still moves the playhead's segment through timeupdate
    m.at(5);
    await settle();
    expect(el.currentSegment?.id).toBe("s2");
    // Back in view: the loop runs again and the playhead catches up
    el.style.cssText = "";
    expect(await until(() => !el.hasAttribute("data-offscreen"))).toBe(true);
    expect(loop()).not.toBe(0);
    expect(Number(wave(el).style.getPropertyValue("--at"))).toBeCloseTo(5 / 20, 2);
    // Paused: the watch ends
    m.audio.pause();
    await settle();
    expect(loop()).toBe(0);
    expect(el.hasAttribute("data-offscreen")).toBe(false);
  });

  test("media from src: an <audio> the element makes; its duration replaces the estimate; the speed cycles", async () => {
    const el = await fixture<TcTranscriptReview>(html`<tc-transcript-review .segments=${SEGS.slice(0, 2)} src=${wav(12)}></tc-transcript-review>`);
    const audio = el.querySelector<HTMLAudioElement>("audio.ui-tsr__media")!;
    expect(audio).toBeTruthy();
    expect(audio.controls).toBe(false);
    if (audio.readyState < 1) await new Promise((r) => audio.addEventListener("loadedmetadata", r, { once: true }));
    await settle();
    expect(el.totalDuration).toBeCloseTo(12, 1);
    el.seek(5);
    await settle();
    expect(audio.currentTime).toBeCloseTo(5, 1);
    expect(el.currentSegment?.id).toBe("s2");
    const rate = el.querySelector<HTMLButtonElement>(".ui-tsr__rate")!;
    rate.click();
    await settle();
    expect(audio.playbackRate).toBe(1.25);
    expect(rate.getAttribute("aria-label")).toBe("Playback speed 1.25×");
    expect(el.querySelector(".ui-tsr__screen")).toBeNull();
  });

  test("video: made from src or passed in, shown above the waveform with the current segment as a caption", async () => {
    const el = await fixture<TcTranscriptReview>(html`<tc-transcript-review kind="video" src="clip.mp4" .segments=${SEGS}></tc-transcript-review>`);
    expect(el.querySelector(".ui-tsr__screen video.ui-tsr__media")).toBeTruthy();
    el.seek(5);
    await settle();
    expect(text(el.querySelector(".ui-tsr__caption"))).toBe("El pedido no llegó.");
    const video = document.createElement("video");
    el.media = video;
    await settle();
    expect(video.parentElement).toBe(el.querySelector(".ui-tsr__screen"));
    expect(el.querySelector(".ui-tsr__media")).toBeNull();
    el.media = null;
    await settle();
    expect(video.isConnected).toBe(false);
  });

  test("a recording that won't load says so, with Try again", async () => {
    const el = await fixture<TcTranscriptReview>(html`<tc-transcript-review .segments=${SEGS} src="data:audio/wav;base64,AAAA"></tc-transcript-review>`);
    const audio = el.querySelector<HTMLAudioElement>("audio")!;
    if (!audio.error) await new Promise((r) => audio.addEventListener("error", r, { once: true }));
    await settle();
    const error = el.querySelector(".ui-tsr__error")!;
    expect(error.getAttribute("role")).toBe("alert");
    expect(text(error)).toBe("The recording couldn't load.Try again");
    let loads = 0;
    audio.load = () => void loads++;
    error.querySelector("button")!.click();
    await settle();
    expect(loads).toBe(1);
    expect(el.querySelector(".ui-tsr__error")).toBeNull();
  });

  test("no media: play is unavailable but the transcript still seeks; no segments: an empty list and no footer", async () => {
    const el = await make();
    expect(el.querySelector(".ui-tsr__play")!.getAttribute("aria-disabled")).toBe("true");
    const empty = await fixture<TcTranscriptReview>(html`<tc-transcript-review></tc-transcript-review>`);
    expect(text(empty.querySelector(".ui-tsr__empty"))).toBe("No transcript yet.");
    expect(empty.querySelector(".ui-tsr__foot")).toBeNull();
    expect(empty.querySelector(".tc-head__aside")).toBeNull();
  });

  test("windowing: 5,000 segments render only the rows near the viewport; End and seeking reach the last", async () => {
    const many: TranscriptSegment[] = Array.from({ length: 5000 }, (_, i) => ({ id: `w${i}`, start: i * 4, end: i * 4 + 3.5, speaker: i % 3 ? "a" : "b", text: `Segment ${i}: the parcel left the northern warehouse.`, confidence: i % 10 ? 0.9 : 0.5 }));
    const el = await fixture<TcTranscriptReview>(html`<tc-transcript-review .segments=${many} .speakers=${SPEAKERS}></tc-transcript-review>`);
    await frame();
    await settle();
    expect(el.querySelector(".ui-tsr__rows")!.hasAttribute("data-virtual")).toBe(true);
    expect(rows(el).length).toBeLessThan(200);
    expect(rows(el)[0].getAttribute("aria-setsize")).toBe("5000");
    const list = el.querySelector<HTMLElement>(".ui-tsr__list")!;
    expect(list.scrollHeight).toBeGreaterThan(5000 * 40);
    // Waveform marks stay few however many segments there are
    expect(el.querySelectorAll(".ui-tsr__lowband").length).toBeLessThanOrEqual(500);
    row(el, "w0").focus();
    await key(row(el, "w0"), "End");
    for (let i = 0; i < 3; i++) {
      await frame();
      await settle();
    }
    expect((document.activeElement as HTMLElement).dataset.id).toBe("w4999");
    expect(rows(el).length).toBeLessThan(200);
    el.seek(2500 * 4 + 1);
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 150));
      await settle();
    }
    expect(row(el, "w2500")).toBeTruthy();
    expect(row(el, "w2500").getAttribute("aria-selected")).toBe("true");
  });

  test("clean: one card", async () => {
    const el = await fixture<TcTranscriptReview>(html`<tc-transcript-review look="clean" .segments=${SEGS}></tc-transcript-review>`);
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(".ui-tsr__body")).toBeTruthy();
    expect(el.querySelector(".ui-tsr__card")).toBeNull();
  });

  test("React: controlled sent survives a parent re-render; onVerify, onSegmentChange and onCopy fire", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const verified: string[] = [];
    const playing: (string | null)[] = [];
    let rerender: (n: number) => void = () => {};
    function App() {
      const [sent, setSent] = React.useState<string[]>([]);
      const [n, set] = React.useState(0);
      rerender = set;
      return React.createElement(TranscriptReview, {
        "data-n": n,
        title: "Call",
        segments: SEGS,
        speakers: SPEAKERS,
        sent,
        onSentChange: setSent,
        onVerify: (s) => verified.push(s.id),
        onSegmentChange: (s) => playing.push(s?.id ?? null),
      } as React.ComponentProps<typeof TranscriptReview>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcTranscriptReview>("tc-transcript-review")!;
    expect(el.getAttribute("aria-label")).toBe("Call");
    await act(async () => row(el, "s2").click());
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-tsr__act--verify")!.click());
    await settle();
    expect(verified).toEqual(["s2"]);
    expect(playing).toEqual(["s2"]);
    expect(el.sent).toEqual(["s2"]);
    await act(async () => rerender(1));
    await settle();
    expect(el.sent).toEqual(["s2"]);
    await act(async () => root.unmount());
  });

  test("React uncontrolled: the query, hidden speakers and view keep the element's changes across parent renders", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let rerender: (n: number) => void = () => {};
    const queries: string[] = [];
    function App() {
      const [n, set] = React.useState(0);
      rerender = set;
      return React.createElement(TranscriptReview, { "data-n": n, segments: SEGS, onQueryChange: (q: string) => queries.push(q) } as React.ComponentProps<typeof TranscriptReview>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcTranscriptReview>("tc-transcript-review")!;
    const input = el.querySelector<HTMLInputElement>(".ui-tsr__input")!;
    await act(async () => {
      input.value = "pedido";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => el.querySelectorAll<HTMLButtonElement>(".ui-tsr__spk")[0].click());
    await act(async () => el.querySelectorAll<HTMLButtonElement>(".ui-tsr__mode")[2].click());
    await act(async () => rerender(1));
    await settle();
    expect(queries).toEqual(["pedido"]);
    expect(el.query).toBe("pedido");
    expect(el.hiddenSpeakers).toEqual(["a"]);
    expect(el.translationMode).toBe("both");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"])
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="background: ${theme === "dark" ? "#0e0e10" : "#fff"}; padding: 8px">
        <tc-transcript-review .segments=${SEGS} .speakers=${SPEAKERS} .peaks=${PEAKS} duration="20" .sent=${["s2"]}></tc-transcript-review>
        <tc-transcript-review look="clean" heading="Clean" translation-mode="both" query="pedido" .segments=${SEGS} .speakers=${SPEAKERS} .peaks=${PEAKS} .hiddenSpeakers=${["a"]}></tc-transcript-review>
        <tc-transcript-review look="clean" heading="Narrow" style="width: 320px" translation-mode="both" .segments=${SEGS} .speakers=${SPEAKERS}></tc-transcript-review>
        <tc-transcript-review heading="Empty"></tc-transcript-review>
      </div>`);
      const [first] = [...wrap.querySelectorAll<TcTranscriptReview>("tc-transcript-review")];
      first.seek(5);
      await settle();
      await Promise.all(document.getAnimations().map((x) => (x.finish(), x.finished)));
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
});
