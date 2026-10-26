/*
 * <tc-voice-mode> in real browsers: state, captions, the live region, the toolbar, values and events, the wrapper, axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/voice-mode";
import type { TcVoiceMode, VoiceTurn } from "../../src/elements/voice-mode";
import { VoiceMode } from "../../src/elements/react/voice-mode";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const turns: VoiceTurn[] = [
  { id: "u1", role: "user", text: "Move my three o'clock to tomorrow." },
  { id: "a1", role: "assistant", text: "Tomorrow at 9:30 is free. Send the invite?" },
];
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent!.trim();
const button = (el: Element, name: string) =>
  [...el.querySelectorAll<HTMLButtonElement>(".ui-vm__bar button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === name)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-voice-mode", () => {
  test("the host is the root, in both looks; the orb shows the state", async () => {
    const el = await fixture<TcVoiceMode>(html`<tc-voice-mode state="listening" .turns=${turns}></tc-voice-mode>`);
    expect(el.dataset.ui).toBe("vm");
    expect(el.dataset.look).toBe("standard");
    expect(el.dataset.state).toBe("listening");
    const orb = el.querySelector("tc-voice-orb")!;
    expect(orb.state).toBe("listening");
    expect(orb.size).toBe(148);
    expect(orb.getAttribute("aria-hidden")).toBe("true");
    expect(el.querySelector(".ui-vm__state")!.textContent!.trim()).toBe("Listening");
    // Standard: the controls sit on the tray, outside the card
    expect(el.querySelector(".ui-vm__card .ui-vm__bar")).toBeNull();
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
    // The card is rebuilt for the other look: a new orb
    expect(el.querySelector("tc-voice-orb")!.size).toBe(128);
    expect(el.querySelector(".ui-vm__card .ui-vm__bar")).toBeTruthy();
  });

  test("every turn is captioned with its speaker; a partial turn carries the caret", async () => {
    const el = await fixture<TcVoiceMode>(html`<tc-voice-mode name="Atlas" user-name="Sam" .turns=${[...turns, { id: "u2", role: "user", text: "Yes and", partial: true }]}></tc-voice-mode>`);
    const items = [...el.querySelectorAll(".ui-vm__turn")];
    expect(items.map((i) => i.querySelector(".ui-vm__who")!.textContent)).toEqual(["Sam", "Atlas", "Sam"]);
    expect(items[2].hasAttribute("data-partial")).toBe(true);
    expect(items[2].querySelector(".ui-vm__caret")).toBeTruthy();
    expect(items[1].querySelector(".ui-vm__caret")).toBeNull();
    expect(el.querySelector('.ui-vm__captions[role="region"][aria-label="Captions"]')!.getAttribute("tabindex")).toBe("0");
  });

  test("no turns: the placeholder", async () => {
    const el = await fixture<TcVoiceMode>(html`<tc-voice-mode placeholder="Say something"></tc-voice-mode>`);
    expect(el.querySelector(".ui-vm__empty")!.textContent).toBe("Say something");
  });

  test("screen readers hear finished turns only – not partial words, not the history on load", async () => {
    const el = await fixture<TcVoiceMode>(html`<tc-voice-mode name="Atlas" .turns=${turns}></tc-voice-mode>`);
    expect(status(el)).toBe("");
    el.turns = [...turns, { id: "u2", role: "user", text: "Yes", partial: true }];
    await settle();
    expect(status(el)).toBe("");
    el.turns = [...turns, { id: "u2", role: "user", text: "Yes please", partial: true }];
    await settle();
    expect(status(el)).toBe("");
    el.turns = [...turns, { id: "u2", role: "user", text: "Yes please." }];
    await settle();
    expect(status(el)).toBe("You: Yes please.");
    // The same finished turn again (a re-render) isn't repeated; the next one replaces it
    el.turns = [...el.turns];
    await settle();
    expect(status(el)).toBe("You: Yes please.");
    el.turns = [...el.turns, { id: "a2", role: "assistant", text: "Sent." }];
    await settle();
    expect(status(el)).toBe("Atlas: Sent.");
    // The caption list itself is not live
    expect(el.querySelector(".ui-vm__captions")!.getAttribute("aria-live")).toBeNull();
  });

  test("labels per state and while muted", async () => {
    const el = await fixture<TcVoiceMode>(html`<tc-voice-mode state="speaking" .labels=${{ speaking: "Atlas is talking" }}></tc-voice-mode>`);
    expect(el.querySelector(".ui-vm__state")!.textContent!.trim()).toBe("Atlas is talking");
    el.state = "listening";
    el.muted = true;
    await settle();
    expect(el.querySelector(".ui-vm__state")!.textContent!.trim()).toBe("Muted");
    expect(el.querySelector("tc-voice-orb")!.level).toBe(0);
    el.level = 0.7;
    el.muted = false;
    await settle();
    expect(el.querySelector("tc-voice-orb")!.level).toBe(0.7);
  });

  test("heading", async () => {
    const el = await fixture<TcVoiceMode>(html`<tc-voice-mode heading="Atlas voice"></tc-voice-mode>`);
    expect(el.querySelector("h3")!.textContent).toBe("Atlas voice");
  });

  test("Mute and Captions are toggles with cancelable change events", async () => {
    const el = await fixture<TcVoiceMode>(html`<tc-voice-mode .turns=${turns}></tc-voice-mode>`);
    const seen: unknown[] = [];
    el.addEventListener("tc-muted-change", (e) => seen.push((e as CustomEvent).detail));
    el.addEventListener("tc-captions-change", (e) => seen.push((e as CustomEvent).detail));
    button(el, "Mute").click();
    await settle();
    expect(el.muted).toBe(true);
    expect(el.hasAttribute("muted")).toBe(true);
    expect(button(el, "Mute").getAttribute("aria-pressed")).toBe("true");
    button(el, "Captions").click();
    await settle();
    expect(el.captions).toBe(false);
    expect(el.querySelector(".ui-vm__captions")).toBeNull();
    expect(button(el, "Captions").getAttribute("aria-pressed")).toBe("false");
    expect(seen).toEqual([{ muted: true }, { captions: false }]);
    // Captions off, finished turns are still announced
    el.turns = [...turns, { id: "a2", role: "assistant", text: "Done." }];
    await settle();
    expect(status(el)).toBe("Assistant: Done.");
  });

  test("controlled: preventDefault() keeps the values", async () => {
    const el = await fixture<TcVoiceMode>(html`<tc-voice-mode></tc-voice-mode>`);
    el.addEventListener("tc-muted-change", (e) => e.preventDefault());
    el.addEventListener("tc-captions-change", (e) => e.preventDefault());
    button(el, "Mute").click();
    button(el, "Captions").click();
    await settle();
    expect(el.muted).toBe(false);
    expect(el.captions).toBe(true);
  });

  test("Interrupt works only while the assistant thinks or speaks; Esc interrupts too; End always", async () => {
    const el = await fixture<TcVoiceMode>(html`<tc-voice-mode state="listening"></tc-voice-mode>`);
    const fired: string[] = [];
    el.addEventListener("tc-interrupt", () => fired.push("interrupt"));
    el.addEventListener("tc-end", () => fired.push("end"));
    const interrupt = button(el, "Interrupt");
    expect(interrupt.getAttribute("aria-disabled")).toBe("true");
    interrupt.click();
    key(interrupt, "Escape");
    expect(fired).toEqual([]);
    el.state = "speaking";
    await settle();
    expect(interrupt.getAttribute("aria-disabled")).toBe("false");
    interrupt.click();
    key(el.querySelector(".ui-vm__captions")!, "Escape");
    el.state = "thinking";
    await settle();
    key(interrupt, "Escape");
    button(el, "End").click();
    expect(fired).toEqual(["interrupt", "interrupt", "interrupt", "end"]);
  });

  test("the toolbar: one tab stop, arrows, Home and End move", async () => {
    const el = await fixture<TcVoiceMode>(html`<tc-voice-mode></tc-voice-mode>`);
    const bar = el.querySelector('[role="toolbar"]')!;
    expect(bar.getAttribute("aria-label")).toBe("Voice controls");
    const tools = [...bar.querySelectorAll("button")];
    expect(tools.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1]);
    tools[0].focus();
    key(tools[0], "ArrowRight");
    await settle();
    expect(document.activeElement).toBe(tools[1]);
    expect(tools.map((b) => b.tabIndex)).toEqual([-1, 0, -1, -1]);
    key(tools[1], "End");
    await settle();
    expect(document.activeElement).toBe(tools[3]);
    key(tools[3], "ArrowRight");
    await settle();
    expect(document.activeElement).toBe(tools[0]);
    key(tools[0], "ArrowLeft");
    await settle();
    expect(document.activeElement).toBe(tools[3]);
    key(tools[3], "Home");
    await settle();
    expect(document.activeElement).toBe(tools[0]);
  });

  test("the captions follow new words unless someone scrolled up", async () => {
    const many: VoiceTurn[] = Array.from({ length: 14 }, (_, i) => ({ id: `t${i}`, role: i % 2 ? "assistant" : "user", text: `Turn number ${i} with a few words in it.` }));
    const el = await fixture<TcVoiceMode>(html`<tc-voice-mode .turns=${many}></tc-voice-mode>`);
    const list = el.querySelector<HTMLElement>(".ui-vm__captions")!;
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    expect(list.scrollHeight - list.scrollTop - list.clientHeight).toBeLessThan(2);
    list.scrollTop = 0;
    list.dispatchEvent(new Event("scroll"));
    el.turns = [...many, { id: "x", role: "user", text: "More", partial: true }];
    await settle();
    expect(list.scrollTop).toBe(0);
    list.scrollTop = list.scrollHeight;
    list.dispatchEvent(new Event("scroll"));
    el.turns = [...el.turns, { id: "y", role: "assistant", text: "And more" }];
    await settle();
    expect(list.scrollHeight - list.scrollTop - list.clientHeight).toBeLessThan(2);
  });

  test("dark follows .dark, data-theme, data-tc-theme and system alike", async () => {
    const css = (customElements.get("tc-voice-mode") as unknown as { css: string }).css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
  });

  test("wrapper: muted survives a parent re-render; callbacks fire; title becomes the heading", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(VoiceMode, {
        title: "Atlas",
        state: "speaking",
        turns,
        "data-n": n,
        onMutedChange: (m: boolean) => calls.push(`muted:${m}`),
        onInterrupt: () => calls.push("interrupt"),
        onEnd: () => calls.push("end"),
      } as React.ComponentProps<typeof VoiceMode>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-voice-mode")!;
    expect(el.querySelector("h3")!.textContent).toBe("Atlas");
    button(el, "Mute").click();
    await settle();
    expect(el.muted).toBe(true);
    await act(async () => bump());
    await settle();
    expect(el.muted).toBe(true);
    button(el, "Interrupt").click();
    button(el, "End").click();
    expect(calls).toEqual(["muted:true", "interrupt", "end"]);
    await act(async () => root.unmount());
  });

  test("wrapper: controlled captions stay as given", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: boolean[] = [];
    await act(async () => root.render(React.createElement(VoiceMode, { captions: true, onCaptionsChange: (c: boolean) => seen.push(c) })));
    await settle();
    const el = host.querySelector("tc-voice-mode")!;
    button(el, "Captions").click();
    await settle();
    expect(seen).toEqual([false]);
    expect(el.captions).toBe(true);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const partial: VoiceTurn[] = [...turns, { id: "u2", role: "user", text: "Yes, and add", partial: true }];
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="background: Canvas">
        <tc-voice-mode heading="Atlas" state="speaking" .turns=${partial}></tc-voice-mode>
        <tc-voice-mode look="clean" state="listening" muted .turns=${turns}></tc-voice-mode>
        <tc-voice-mode look="clean" .captions=${false}></tc-voice-mode>
      </div>`);
      // Entry animations finish before axe measures contrast
      wrap
        .getAnimations({ subtree: true })
        .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
        .forEach((a) => a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
});
