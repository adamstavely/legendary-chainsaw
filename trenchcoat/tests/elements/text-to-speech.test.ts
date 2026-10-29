/*
 * <tc-text-to-speech> in real browsers, with speech synthesis stubbed (no real voices): the structure in both looks,
 * sentence splitting, reading sentence by sentence with word marks from boundary events (and without them), pause,
 * resume, stop and skips, reading from a clicked or focused sentence, the speed, pitch and voice with preventDefault,
 * voices that load late, the unsupported state, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/text-to-speech";
import { splitSentences, type TcTextToSpeech, type TextToSpeechEnd, type TextToSpeechRateChange, type TextToSpeechStart, type TextToSpeechVoiceChange } from "../../src/elements/text-to-speech";
import { TextToSpeech } from "../../src/elements/react/text-to-speech";
import { cleanup, finish, fixture, settle } from "./helpers";

const g = globalThis as Record<string, unknown>;
const restores: (() => void)[] = [];
afterEach(() => {
  cleanup();
  while (restores.length) restores.pop()!();
});

/** Replaces a property of `obj` for one test */
function stub(obj: object, key: string, value: unknown) {
  const own = Object.getOwnPropertyDescriptor(obj, key);
  Object.defineProperty(obj, key, { configurable: true, writable: true, value });
  restores.push(() => (own ? Object.defineProperty(obj, key, own) : delete (obj as Record<string, unknown>)[key]));
}

type Voice = { voiceURI: string; name: string; lang: string; default: boolean; localService: boolean };
class FakeUtterance {
  rate = 1;
  pitch = 1;
  voice: Voice | null = null;
  lang = "";
  onboundary: ((e: { name: string; charIndex: number }) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  constructor(public text: string) {}
}

/** A speechSynthesis that records what it was asked to say; the test fires the utterances' events */
function installSpeech(voices: Voice[] = []) {
  const spoken: FakeUtterance[] = [];
  const listeners: (() => void)[] = [];
  let list = voices;
  let cancels = 0;
  stub(g, "SpeechSynthesisUtterance", FakeUtterance);
  stub(window, "speechSynthesis", {
    speak: (u: FakeUtterance) => void spoken.push(u),
    cancel: () => void cancels++,
    getVoices: () => list,
    addEventListener: (_: string, fn: () => void) => void listeners.push(fn),
    removeEventListener: () => {},
  });
  return {
    spoken,
    last: () => spoken[spoken.length - 1],
    cancels: () => cancels,
    setVoices(v: Voice[]) {
      list = v;
      for (const fn of listeners) fn();
    },
  };
}

const TEXT = "The light was first lit in 1871. Its lens came from Paris in eleven crates.\n\nKeepers wound the clockwork at dusk. It was automated in 1962.";
const VOICES: Voice[] = [
  { voiceURI: "v-ava", name: "Ava", lang: "en-US", default: true, localService: true },
  { voiceURI: "v-moira", name: "Moira", lang: "en-IE", default: false, localService: true },
  { voiceURI: "v-amelie", name: "Amélie", lang: "fr-CA", default: false, localService: true },
];

const make = (look: "standard" | "clean" = "standard", text = TEXT) =>
  fixture<TcTextToSpeech>(html`<tc-text-to-speech look=${look} heading="Harrow Point light" description="Audio guide" .text=${text}></tc-text-to-speech>`);
const sentences = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-tts__sentence")];
const button = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-tts__bar button")].find((b) => b.textContent!.trim() === name)!;
const progress = (el: Element) => el.querySelector(".ui-tts__progress")!.textContent!.replace(/\s+/g, " ").trim();
const setRange = async (input: HTMLInputElement, value: number) => {
  input.value = String(value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};

describe("splitSentences", () => {
  test("another reader (or the page) cancelling the shared speech queue leaves this one paused, not stuck playing", async () => {
    const speech = installSpeech(VOICES);
    const el = await make();
    el.play();
    await settle();
    expect(el.state).toBe("playing");
    // The queue is the page's: someone else's cancel interrupts our utterance
    speech.last().onerror!({ error: "interrupted" });
    await settle();
    expect(el.state).toBe("paused");
    // Our own Pause is still ignored by the late error of the utterance it cancelled
    el.play();
    await settle();
    const ours = speech.last();
    el.pause();
    ours.onerror!({ error: "interrupted" });
    await settle();
    expect(el.state).toBe("paused");
  });

  test("lang reflects to the attribute, as HTMLElement's does", async () => {
    installSpeech(VOICES);
    const el = await make();
    el.lang = "fr";
    await settle();
    expect(el.getAttribute("lang")).toBe("fr");
  });

  test("paragraphs at blank lines, sentences inside, and each word's place", () => {
    const s = splitSentences(TEXT, "en");
    expect(s.map((x) => x.text)).toEqual(["The light was first lit in 1871.", "Its lens came from Paris in eleven crates.", "Keepers wound the clockwork at dusk.", "It was automated in 1962."]);
    expect(s.map((x) => x.paragraph)).toEqual([0, 0, 1, 1]);
    expect(s[0].words).toHaveLength(7);
    expect(s[0].text.slice(s[0].words[6].start, s[0].words[6].end)).toBe("1871.");
    expect(splitSentences("  \n\n ")).toEqual([]);
  });
});

describe("tc-text-to-speech", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: header, the passage as one tab stop, the toolbar, progress and settings`, async () => {
      installSpeech(VOICES);
      const el = await make(look);
      expect(el.dataset.ui).toBe("tts");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Harrow Point light");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Audio guide");
      expect(el.querySelector(".ui-tts__card")!.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      expect(el.querySelectorAll(".ui-tts__para")).toHaveLength(2);
      const s = sentences(el);
      expect(s).toHaveLength(4);
      expect(s.every((x) => x.getAttribute("role") === "button")).toBe(true);
      expect(s.map((x) => x.tabIndex)).toEqual([0, -1, -1, -1]);
      expect(document.getElementById(s[0].getAttribute("aria-describedby")!)!.textContent).toContain("Enter reads from this sentence");
      expect(el.querySelector(".ui-tts__passage")!.getAttribute("aria-label")).toBe("Passage");
      const bar = el.querySelector(".ui-tts__bar")!;
      expect(bar.getAttribute("role")).toBe("toolbar");
      expect([...bar.querySelectorAll("button")].map((b) => b.textContent!.trim())).toEqual(["Previous sentence", "Play", "Next sentence", "Stop"]);
      // One tab stop: the first enabled button
      expect([...bar.querySelectorAll("button")].filter((b) => b.tabIndex === 0)).toHaveLength(1);
      expect(button(el, "Previous sentence").disabled).toBe(true);
      expect(button(el, "Stop").disabled).toBe(true);
      expect(progress(el)).toBe("Sentence 1 of 4·Under a minute left");
      expect([...el.querySelectorAll("option")].map((o) => o.textContent!.trim())).toEqual(["Default voice", "Ava – en-US", "Moira – en-IE", "Amélie – fr-CA"]);
      expect(el.querySelector(".ui-tts__value")!.textContent).toBe("1.0×");
      expect(el.state).toBe("idle");
      expect(el.querySelector(".ui-tts__pill")).toBeNull();
    });
  }

  test("plays sentence by sentence, marks the spoken word, and ends at the last sentence", async () => {
    const speech = installSpeech();
    const el = await make();
    const starts: TextToSpeechStart[] = [];
    const ends: TextToSpeechEnd[] = [];
    el.addEventListener("tc-start", (e) => starts.push((e as CustomEvent<TextToSpeechStart>).detail));
    el.addEventListener("tc-end", (e) => ends.push((e as CustomEvent<TextToSpeechEnd>).detail));
    button(el, "Play").click();
    await settle();
    expect(el.state).toBe("playing");
    expect(el.dataset.state).toBe("playing");
    expect(starts).toEqual([{ sentence: 0 }]);
    expect(speech.last().text).toBe("The light was first lit in 1871.");
    expect(el.querySelector(".ui-tts__pill")!.textContent).toBe("Reading");
    expect(button(el, "Pause")).toBeTruthy();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Reading");
    expect(sentences(el)[0].getAttribute("aria-current")).toBe("true");
    // A word boundary marks the word containing it
    speech.last().onboundary!({ name: "word", charIndex: 10 });
    await settle();
    expect(el.querySelector(".ui-tts__word[data-current]")!.textContent).toBe("was");
    speech.last().onboundary!({ name: "sentence", charIndex: 27 });
    await settle();
    expect(el.querySelector(".ui-tts__word[data-current]")!.textContent).toBe("was");
    speech.last().onend!();
    await settle();
    expect(speech.last().text).toBe("Its lens came from Paris in eleven crates.");
    expect(progress(el)).toMatch(/^Sentence 2 of 4/);
    // No boundaries from this voice: the sentence is shaded, no word is marked
    expect(sentences(el)[1].hasAttribute("data-current")).toBe(true);
    expect(el.querySelector(".ui-tts__word[data-current]")).toBeNull();
    speech.last().onend!();
    await settle();
    speech.last().onend!();
    await settle();
    expect(speech.last().text).toBe("It was automated in 1962.");
    speech.last().onend!();
    await settle();
    expect(el.state).toBe("idle");
    expect(ends).toEqual([{ completed: true, sentence: 3 }]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Finished reading");
    expect(progress(el)).toMatch(/^Sentence 1 of 4/);
    expect(speech.spoken).toHaveLength(4);
  });

  test("pause, resume, skip and stop – and a cancelled sentence's late end is ignored", async () => {
    const speech = installSpeech();
    const el = await make();
    const ends: TextToSpeechEnd[] = [];
    el.addEventListener("tc-end", (e) => ends.push((e as CustomEvent<TextToSpeechEnd>).detail));
    button(el, "Play").click();
    await settle();
    const first = speech.last();
    button(el, "Next sentence").click();
    await settle();
    expect(speech.last().text).toBe("Its lens came from Paris in eleven crates.");
    // The skipped utterance ends late (cancel fires its end): nothing moves
    first.onend!();
    await settle();
    expect(speech.spoken).toHaveLength(2);
    expect(progress(el)).toMatch(/^Sentence 2 of 4/);
    button(el, "Pause").click();
    await settle();
    expect(el.state).toBe("paused");
    expect(el.querySelector(".ui-tts__pill")!.textContent).toBe("Paused");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Paused");
    const cancels = speech.cancels();
    expect(cancels).toBeGreaterThan(0);
    // Resume starts the sentence again
    button(el, "Resume").click();
    await settle();
    expect(el.state).toBe("playing");
    expect(speech.last().text).toBe("Its lens came from Paris in eleven crates.");
    expect(speech.spoken).toHaveLength(3);
    button(el, "Previous sentence").click();
    await settle();
    expect(speech.last().text).toBe("The light was first lit in 1871.");
    button(el, "Stop").click();
    await settle();
    expect(el.state).toBe("idle");
    expect(ends).toEqual([{ completed: false, sentence: 0 }]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Stopped");
    // Skipping while idle moves the place without speaking
    button(el, "Next sentence").click();
    await settle();
    expect(speech.spoken).toHaveLength(4);
    expect(progress(el)).toMatch(/^Sentence 2 of 4/);
    expect(sentences(el)[1].hasAttribute("data-next")).toBe(true);
  });

  test("click a sentence to read from it; the passage keys move, Enter reads and Space pauses and resumes", async () => {
    const speech = installSpeech();
    const el = await make();
    sentences(el)[2].click();
    await settle();
    expect(speech.last().text).toBe("Keepers wound the clockwork at dusk.");
    button(el, "Pause").click();
    await settle();
    const s = sentences(el);
    s[2].focus();
    s[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await settle();
    await expect.poll(() => document.activeElement).toBe(sentences(el)[3]);
    expect(sentences(el).map((x) => x.tabIndex)).toEqual([-1, -1, -1, 0]);
    sentences(el)[3].dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => document.activeElement).toBe(sentences(el)[0]);
    sentences(el)[0].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await settle();
    expect(speech.last().text).toBe("The light was first lit in 1871.");
    expect(el.state).toBe("playing");
    // Space on the sentence being read pauses, and again resumes
    sentences(el)[0].dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await settle();
    expect(el.state).toBe("paused");
    sentences(el)[0].dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await settle();
    expect(el.state).toBe("playing");
    // Space on another sentence reads from there
    sentences(el)[1].dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await settle();
    expect(speech.last().text).toBe("Its lens came from Paris in eleven crates.");
  });

  test("speed, pitch and voice: events with preventDefault, and a new speed restarts the sentence", async () => {
    const speech = installSpeech(VOICES);
    const el = await make();
    const rates: TextToSpeechRateChange[] = [];
    el.addEventListener("tc-rate-change", (e) => rates.push((e as CustomEvent<TextToSpeechRateChange>).detail));
    const [rate, pitch] = [...el.querySelectorAll<HTMLInputElement>(".ui-tts__range")];
    await setRange(rate, 1.5);
    expect(rates).toEqual([{ rate: 1.5 }]);
    expect(el.rate).toBe(1.5);
    expect(el.querySelector(".ui-tts__value")!.textContent).toBe("1.5×");
    expect(rate.getAttribute("aria-valuetext")).toBe("1.5 times");
    const keep = (e: Event) => e.preventDefault();
    el.addEventListener("tc-rate-change", keep);
    await setRange(rate, 2);
    expect(el.rate).toBe(1.5);
    expect(rate.value).toBe("1.5");
    el.removeEventListener("tc-rate-change", keep);
    await setRange(pitch, 0.8);
    expect(el.pitch).toBe(0.8);
    const voices: TextToSpeechVoiceChange[] = [];
    el.addEventListener("tc-voice-change", (e) => voices.push((e as CustomEvent<TextToSpeechVoiceChange>).detail));
    const select = el.querySelector<HTMLSelectElement>("select")!;
    select.value = "v-moira";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(voices).toEqual([{ voice: "v-moira" }]);
    button(el, "Play").click();
    await settle();
    expect(speech.last()).toMatchObject({ rate: 1.5, pitch: 0.8, lang: "en-IE" });
    expect(speech.last().voice!.name).toBe("Moira");
    // A new speed while reading: the sentence starts again with it, once the slider settles
    await setRange(rate, 0.5);
    await expect.poll(() => speech.spoken.length).toBe(2);
    expect(speech.last()).toMatchObject({ rate: 0.5, text: "The light was first lit in 1871." });
  });

  test("voices that load late fill the picker; `lang` picks a matching default voice", async () => {
    const speech = installSpeech();
    const el = await fixture<TcTextToSpeech>(html`<tc-text-to-speech lang="fr" .text=${"Bonjour. Au revoir."}></tc-text-to-speech>`);
    expect(el.querySelectorAll("option")).toHaveLength(1);
    speech.setVoices(VOICES);
    await settle();
    expect(el.querySelectorAll("option")).toHaveLength(4);
    button(el, "Play").click();
    await settle();
    expect(speech.last().voice!.name).toBe("Amélie");
  });

  test("without speech synthesis the text stays readable and the controls are off", async () => {
    stub(window, "speechSynthesis", undefined);
    const el = await make();
    expect(el.querySelector(".ui-tts__unsupported")!.textContent).toContain("isn't available");
    expect(sentences(el)).toHaveLength(4);
    expect(sentences(el).some((s) => s.hasAttribute("role") || s.hasAttribute("tabindex"))).toBe(false);
    expect([...el.querySelectorAll<HTMLButtonElement>(".ui-tts__bar button")].every((b) => b.disabled)).toBe(true);
    expect(el.querySelector("select")!.disabled).toBe(true);
  });

  test("empty text, new text while reading, and leaving the page cancels the speech", async () => {
    const speech = installSpeech();
    const el = await make("standard", "");
    expect(el.querySelector(".ui-tts__empty")!.textContent).toBe("Nothing to read yet.");
    expect(button(el, "Play").disabled).toBe(true);
    el.text = TEXT;
    await settle();
    button(el, "Play").click();
    await settle();
    const ends: TextToSpeechEnd[] = [];
    el.addEventListener("tc-end", (e) => ends.push((e as CustomEvent<TextToSpeechEnd>).detail));
    el.text = "A new passage.";
    await settle();
    expect(el.state).toBe("idle");
    expect(ends).toEqual([{ completed: false, sentence: 0 }]);
    button(el, "Play").click();
    await settle();
    const before = speech.cancels();
    el.remove();
    expect(speech.cancels()).toBe(before + 1);
    expect(el.state).toBe("idle");
  });

  test("narrow: the voice gets its own row", async () => {
    installSpeech(VOICES);
    const wrap = await fixture(html`<div style="width: 360px"><tc-text-to-speech .text=${TEXT}></tc-text-to-speech></div>`);
    const voice = wrap.querySelector<HTMLElement>(".ui-tts__field--voice")!;
    const speed = wrap.querySelectorAll<HTMLElement>(".ui-tts__field")[1];
    expect(voice.getBoundingClientRect().bottom).toBeLessThanOrEqual(speed.getBoundingClientRect().top + 1);
    expect(wrap.scrollWidth).toBeLessThanOrEqual(360);
  });

  test("React wrapper: an uncontrolled speed survives parent re-renders; a controlled one stays until the parent changes it", async () => {
    installSpeech();
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const rates: number[] = [];
    const started: number[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(TextToSpeech, { title: "Guide", text: TEXT, onRateChange: (r) => void rates.push(r), onReadStart: (s) => void started.push(s), "data-n": n } as React.ComponentProps<typeof TextToSpeech>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    let el = host.querySelector("tc-text-to-speech")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Guide");
    await setRange(el.querySelector<HTMLInputElement>(".ui-tts__range")!, 1.3);
    await act(async () => bump());
    await settle();
    expect(el.rate).toBe(1.3);
    expect(rates).toEqual([1.3]);
    button(el, "Play").click();
    await settle();
    expect(started).toEqual([0]);
    await act(async () => root.unmount());

    const asked: number[] = [];
    const root2 = createRoot(host);
    await act(async () => root2.render(React.createElement(TextToSpeech, { text: TEXT, rate: 1, onRateChange: (r) => void asked.push(r) })));
    await settle();
    el = host.querySelector("tc-text-to-speech")!;
    await setRange(el.querySelector<HTMLInputElement>(".ui-tts__range")!, 1.8);
    expect(asked).toEqual([1.8]);
    expect(el.rate).toBe(1);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, reading with a word marked, and unsupported`, async () => {
      const speech = installSpeech(VOICES);
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); display: grid; gap: 16px">
        <tc-text-to-speech heading="Harrow Point light" description="Audio guide" .text=${TEXT}></tc-text-to-speech>
        <tc-text-to-speech look="clean" heading="Harrow Point light" .text=${TEXT}></tc-text-to-speech>
      </div>`);
      for (const el of wrap.querySelectorAll<TcTextToSpeech>("tc-text-to-speech")) {
        el.play(1);
        await settle();
        speech.last().onboundary!({ name: "word", charIndex: 4 });
      }
      wrap.querySelectorAll<TcTextToSpeech>("tc-text-to-speech")[1].pause();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
