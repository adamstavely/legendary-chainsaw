/*
 * <tc-speed-reader> in real browsers, with the timing driven by a test scheduler (no fixed waits): word splitting,
 * the recognition point and the pauses, the structure in both looks, reading on to the end, the keys, chunks, the
 * scrubber, the events with preventDefault, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/speed-reader";
import { readerWords, recognitionPoint, wordWeight, type SpeedReaderFinish, type SpeedReaderPositionChange, type SpeedReaderScheduler, type SpeedReaderWpmChange, type TcSpeedReader } from "../../src/elements/speed-reader";
import { SpeedReader } from "../../src/elements/react/speed-reader";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const TEXT = "For most of history, sailors found their way home. Fires were lit on headlands.\n\nKeepers trimmed the wicks at dusk.";

/** A scheduler the test runs by hand: each tick fires the next due word */
function manual() {
  const queue: { run: () => void; ms: number }[] = [];
  const scheduler: SpeedReaderScheduler = {
    set: (run, ms) => {
      const job = { run, ms };
      queue.push(job);
      return job;
    },
    clear: (job) => {
      const i = queue.indexOf(job as (typeof queue)[number]);
      if (i >= 0) queue.splice(i, 1);
    },
  };
  return {
    scheduler,
    queue,
    async tick() {
      const job = queue.shift()!;
      job.run();
      await settle();
      return job.ms;
    },
  };
}

const make = (look: "standard" | "clean" = "standard", scheduler = manual().scheduler, position = 0) =>
  fixture<TcSpeedReader>(html`<tc-speed-reader look=${look} heading="Lighthouses" description="Leaflet" .text=${TEXT} .scheduler=${scheduler} .position=${position}></tc-speed-reader>`);
const shown = (el: Element) => el.querySelector(".ui-spr__frame .ui-spr__sr")?.textContent ?? "";
const pivot = (el: Element) => el.querySelector(".ui-spr__pivot")!.textContent;
const tool = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-spr__bar button")].find((b) => b.textContent!.trim() === name)!;
const key = (el: Element, k: string, shiftKey = false) => el.querySelector(".ui-spr__frame")!.dispatchEvent(new KeyboardEvent("keydown", { key: k, shiftKey, bubbles: true, cancelable: true }));
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;

describe("helpers", () => {
  test("words with their sentences; a blank line ends one", () => {
    const w = readerWords(TEXT);
    expect(w).toHaveLength(20);
    expect(w.map((x) => x.sentence)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2]);
    expect(readerWords("No full stop here\n\nNext one")).toEqual([
      { text: "No", sentence: 0 },
      { text: "full", sentence: 0 },
      { text: "stop", sentence: 0 },
      { text: "here", sentence: 0 },
      { text: "Next", sentence: 1 },
      { text: "one", sentence: 1 },
    ]);
    expect(readerWords("   ")).toEqual([]);
  });

  test("the recognition point sits just left of the middle, past leading punctuation", () => {
    expect(recognitionPoint("a")).toBe(0);
    expect(recognitionPoint("For")).toBe(1);
    expect(recognitionPoint("history,")).toBe(2);
    expect(recognitionPoint("lighthouse")).toBe(3);
    expect(recognitionPoint("extraordinarily")).toBe(4);
    expect(recognitionPoint("“Hello,”")).toBe(2);
  });

  test("sentence ends, commas and long words stay up longer", () => {
    expect(wordWeight("way")).toBe(1);
    expect(wordWeight("history,")).toBe(1.5);
    expect(wordWeight("home.")).toBeCloseTo(2.2);
    expect(wordWeight("headlands.")).toBeCloseTo(2.5);
    expect(wordWeight("extraordinarily")).toBeCloseTo(1.6);
  });
});

describe("tc-speed-reader", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: header, the frame with the recognition point, context, controls and settings`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("spr");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Lighthouses");
      expect(el.querySelector(".ui-spr__pill")!.textContent).toBe("300 wpm");
      const frame = el.querySelector<HTMLElement>(".ui-spr__frame")!;
      expect(frame.getAttribute("aria-label")).toBe("Reader");
      expect(frame.tabIndex).toBe(0);
      expect(frame.getAttribute("aria-keyshortcuts")).toContain("Shift+ArrowLeft");
      // The split word is hidden; screen readers get it whole
      expect(el.querySelector(".ui-spr__word")!.getAttribute("aria-hidden")).toBe("true");
      expect(shown(el)).toBe("For");
      expect([el.querySelector(".ui-spr__left")!.textContent, pivot(el), el.querySelector(".ui-spr__right")!.textContent]).toEqual(["F", "o", "r"]);
      // Not playing: the sentence around the word, the word marked
      expect(el.querySelector(".ui-spr__context")!.textContent!.replace(/\s+/g, " ").trim()).toBe("For most of history, sailors found their way home.");
      expect(el.querySelector(".ui-spr__mark")!.textContent).toBe("For");
      const bar = el.querySelector(".ui-spr__bar")!;
      expect(bar.getAttribute("role")).toBe("toolbar");
      expect([...bar.querySelectorAll("button")].map((b) => b.textContent!.trim())).toEqual(["Start over", "Previous sentence", "Previous word", "Play", "Next word", "Next sentence"]);
      expect([...bar.querySelectorAll("button")].filter((b) => b.tabIndex === 0)).toHaveLength(1);
      expect(tool(el, "Previous word").disabled).toBe(true);
      const [scrub, speed] = [...el.querySelectorAll<HTMLInputElement>(".ui-spr__range")];
      expect(scrub.getAttribute("aria-valuetext")).toBe("Word 1 of 20");
      expect(scrub.max).toBe("19");
      expect(el.querySelector(".ui-spr__scrub .ui-spr__label")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Word 1 of 200:05 left");
      expect(speed.getAttribute("aria-valuetext")).toBe("300 words a minute");
      expect(el.querySelector("select")!.value).toBe("1");
      expect(el.playing).toBe(false);
    });
  }

  test("a listener that keeps the place stops the reading – paused, not stuck on Pause", async () => {
    const clock = manual();
    const el = await make("standard", clock.scheduler);
    el.addEventListener("tc-position-change", (e) => e.preventDefault());
    tool(el, "Play").click();
    await settle();
    await clock.tick();
    await expect.poll(() => tool(el, "Play")).toBeTruthy();
    expect(clock.queue).toHaveLength(0);
  });

  test("reads on word by word with the right pauses, then finishes", async () => {
    const m = manual();
    const el = await make("standard", m.scheduler);
    const moves: SpeedReaderPositionChange[] = [];
    const done: SpeedReaderFinish[] = [];
    el.addEventListener("tc-position-change", (e) => moves.push((e as CustomEvent<SpeedReaderPositionChange>).detail));
    el.addEventListener("tc-finish", (e) => done.push((e as CustomEvent<SpeedReaderFinish>).detail));
    tool(el, "Play").click();
    await settle();
    expect(el.playing).toBe(true);
    expect(el.hasAttribute("data-playing")).toBe(true);
    expect(status(el)).toBe("Reading at 300 words a minute");
    expect(el.querySelector(".ui-spr__context")).toBeNull();
    expect(tool(el, "Pause")).toBeTruthy();
    expect(m.queue).toHaveLength(1);
    // 300 wpm is 200 ms a word
    expect(await m.tick()).toBe(200);
    expect(shown(el)).toBe("most");
    expect(moves).toEqual([{ position: 1 }]);
    await m.tick();
    await m.tick();
    expect(shown(el)).toBe("history,");
    expect(pivot(el)).toBe("s");
    expect(await m.tick()).toBe(300); // the comma
    for (let i = 0; i < 4; i++) await m.tick();
    expect(shown(el)).toBe("home.");
    expect(await m.tick()).toBeCloseTo(440); // the sentence end
    while (m.queue.length) await m.tick();
    expect(shown(el)).toBe("dusk.");
    expect(el.playing).toBe(false);
    expect(done).toEqual([{ words: 20 }]);
    expect(status(el)).toBe("Finished");
    expect(moves).toHaveLength(19);
    // Play at the end starts over
    tool(el, "Play").click();
    await settle();
    expect(shown(el)).toBe("For");
    expect(el.playing).toBe(true);
  });

  test("pause holds the word and shows its sentence; a new speed reschedules", async () => {
    const m = manual();
    const el = await make("standard", m.scheduler);
    tool(el, "Play").click();
    await settle();
    await m.tick();
    const speed = el.querySelectorAll<HTMLInputElement>(".ui-spr__range")[1];
    speed.value = "600";
    speed.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.wpm).toBe(600);
    expect(m.queue).toHaveLength(1);
    expect(await m.tick()).toBe(100);
    tool(el, "Pause").click();
    await settle();
    expect(el.playing).toBe(false);
    expect(m.queue).toHaveLength(0);
    expect(status(el)).toBe("Paused at word 3 of 20");
    expect(el.querySelector(".ui-spr__mark")!.textContent).toBe("of");
  });

  test("keys on the frame: Space, a word, a sentence, the ends", async () => {
    const el = await make();
    key(el, "ArrowRight");
    await settle();
    expect(shown(el)).toBe("most");
    key(el, "ArrowRight", true);
    await settle();
    expect(shown(el)).toBe("Fires");
    key(el, "ArrowRight", true);
    await settle();
    expect(shown(el)).toBe("Keepers");
    key(el, "ArrowRight");
    await settle();
    // Back a sentence: first to this sentence's start, then the one before
    key(el, "ArrowLeft", true);
    await settle();
    expect(shown(el)).toBe("Keepers");
    key(el, "ArrowLeft", true);
    await settle();
    expect(shown(el)).toBe("Fires");
    key(el, "End");
    await settle();
    expect(shown(el)).toBe("dusk.");
    expect(tool(el, "Next word").disabled).toBe(true);
    key(el, "Home");
    await settle();
    expect(shown(el)).toBe("For");
    key(el, " ");
    await settle();
    expect(el.playing).toBe(true);
    key(el, " ");
    await settle();
    expect(el.playing).toBe(false);
    tool(el, "Next sentence").click();
    await settle();
    expect(shown(el)).toBe("Fires");
    tool(el, "Start over").click();
    await settle();
    expect(el.position).toBe(0);
  });

  test("chunks of words: the pivot on the middle word, steps and pauses by the chunk", async () => {
    const m = manual();
    const el = await make("standard", m.scheduler);
    const select = el.querySelector<HTMLSelectElement>("select")!;
    select.value = "3";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.chunk).toBe(3);
    expect(shown(el)).toBe("For most of");
    // The middle word is "most": its recognition point is its "o"
    expect(el.querySelector(".ui-spr__left")!.textContent).toBe("For m");
    expect(el.querySelectorAll(".ui-spr__mark")).toHaveLength(3);
    key(el, "ArrowRight");
    await settle();
    expect(shown(el)).toBe("history, sailors found");
    tool(el, "Play").click();
    await settle();
    expect(await m.tick()).toBe(700);
    expect(shown(el)).toBe("their way home.");
  });

  test("the scrubber moves the place; preventDefault keeps the place, the speed and the chunk", async () => {
    const el = await make();
    const scrub = el.querySelector<HTMLInputElement>(".ui-spr__range")!;
    scrub.value = "14";
    scrub.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(shown(el)).toBe("Keepers");
    expect(scrub.getAttribute("aria-valuetext")).toBe("Word 15 of 20");
    const keep = (e: Event) => e.preventDefault();
    for (const name of ["tc-position-change", "tc-wpm-change", "tc-chunk-change"]) el.addEventListener(name, keep);
    const asked: SpeedReaderWpmChange[] = [];
    el.addEventListener("tc-wpm-change", (e) => asked.push((e as CustomEvent<SpeedReaderWpmChange>).detail));
    key(el, "ArrowRight");
    scrub.value = "2";
    scrub.dispatchEvent(new Event("input", { bubbles: true }));
    const speed = el.querySelectorAll<HTMLInputElement>(".ui-spr__range")[1];
    speed.value = "800";
    speed.dispatchEvent(new Event("input", { bubbles: true }));
    const select = el.querySelector<HTMLSelectElement>("select")!;
    select.value = "2";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(asked).toEqual([{ wpm: 800 }]);
    expect([el.position, el.wpm, el.chunk]).toEqual([14, 300, 1]);
    expect(scrub.value).toBe("14");
    expect(speed.value).toBe("300");
    expect(select.value).toBe("1");
  });

  test("empty text: nothing to read, controls off; text that goes away while playing stops it", async () => {
    const m = manual();
    const el = await fixture<TcSpeedReader>(html`<tc-speed-reader .scheduler=${m.scheduler}></tc-speed-reader>`);
    expect(el.querySelector(".ui-spr__none")!.textContent).toBe("Nothing to read yet.");
    expect(tool(el, "Play").disabled).toBe(true);
    expect(el.querySelector(".ui-spr__context")).toBeNull();
    el.text = TEXT;
    await settle();
    el.play();
    await settle();
    expect(m.queue).toHaveLength(1);
    el.text = "";
    await settle();
    expect(el.playing).toBe(false);
    expect(m.queue).toHaveLength(0);
  });

  test("leaving the page stops the clock", async () => {
    const m = manual();
    const el = await make("standard", m.scheduler);
    el.play();
    await settle();
    expect(m.queue).toHaveLength(1);
    el.remove();
    expect(m.queue).toHaveLength(0);
    expect(el.playing).toBe(false);
  });

  test("narrow: nothing spills sideways and the settings stack", async () => {
    const wrap = await fixture(html`<div style="width: 320px"><tc-speed-reader .text=${TEXT} .scheduler=${manual().scheduler}></tc-speed-reader></div>`);
    const fields = wrap.querySelectorAll<HTMLElement>(".ui-spr__settings .ui-spr__field");
    expect(fields[0].getBoundingClientRect().bottom).toBeLessThanOrEqual(fields[1].getBoundingClientRect().top + 1);
    expect(wrap.scrollWidth).toBeLessThanOrEqual(320);
  });

  test("React wrapper: uncontrolled reading survives parent re-renders; a controlled place stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const m = manual();
    const moved: number[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(SpeedReader, { title: "Briefing", text: TEXT, scheduler: m.scheduler, defaultWpm: 400, onPositionChange: (p) => void moved.push(p), "data-n": n } as React.ComponentProps<typeof SpeedReader>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    let el = host.querySelector("tc-speed-reader")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Briefing");
    expect(el.wpm).toBe(400);
    el.play();
    await settle();
    await act(async () => m.tick());
    await act(async () => m.tick());
    await act(async () => bump());
    await settle();
    expect(el.position).toBe(2);
    expect(moved).toEqual([1, 2]);
    expect(el.playing).toBe(true);
    await act(async () => root.unmount());

    const asked: number[] = [];
    const root2 = createRoot(host);
    await act(async () => root2.render(React.createElement(SpeedReader, { text: TEXT, position: 5, onPositionChange: (p) => void asked.push(p) })));
    await settle();
    el = host.querySelector("tc-speed-reader")!;
    key(el, "ArrowRight");
    await settle();
    expect(asked).toEqual([6]);
    expect(el.position).toBe(5);
    await act(async () => root2.render(React.createElement(SpeedReader, { text: TEXT, position: 6, onPositionChange: (p) => void asked.push(p) })));
    await settle();
    expect(el.position).toBe(6);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, paused and playing`, async () => {
      const m = manual();
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); display: grid; gap: 16px">
        <tc-speed-reader heading="Lighthouses" description="Leaflet" .text=${TEXT} .scheduler=${m.scheduler} .position=${3}></tc-speed-reader>
        <tc-speed-reader look="clean" heading="Lighthouses" .text=${TEXT} .scheduler=${m.scheduler}></tc-speed-reader>
      </div>`);
      wrap.querySelectorAll<TcSpeedReader>("tc-speed-reader")[1].play();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
