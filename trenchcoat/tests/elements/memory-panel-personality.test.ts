/*
 * <tc-memory-panel> Personality: how the assistant talks to the person – a tone with a sample reply, and instructions.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/memory-panel";
import { defaultTones, type Memory, type TcMemoryPanel } from "../../src/elements/memory-panel";
import { MemoryPanel } from "../../src/elements/react/memory-panel";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => cleanup());

const tea: Memory = { id: "a", text: "Likes tea", category: "Preferences" };
const tones = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-mp__tone")];
const tone = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-mp__tone[data-tone="${id}"]`)!;
const field = (el: Element) => el.querySelector<HTMLTextAreaElement>(".ui-mp__instr")!;
const key = (t: Element, k: string) => t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const type = (f: HTMLTextAreaElement, text: string) => {
  f.value = text;
  f.dispatchEvent(new InputEvent("input", { bubbles: true }));
};

for (const look of ["standard", "clean"] as const)
  describe(`tc-memory-panel (${look}) – personality`, () => {
    test("a section named by its heading; the tones are a radiogroup; the picked one's sample describes it", async () => {
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea]}></tc-memory-panel>`);
      const section = el.querySelector<HTMLElement>(".ui-mp__persona")!;
      expect(document.getElementById(section.getAttribute("aria-labelledby")!)!.textContent).toBe("How it talks to you");
      const group = section.querySelector('[role="radiogroup"]')!;
      expect(group.getAttribute("aria-labelledby")).toBe(section.getAttribute("aria-labelledby"));
      expect(tones(el).map((t) => t.querySelector(".ui-mp__tone-label")!.textContent)).toEqual(defaultTones.map((t) => t.label));
      expect(tones(el).map((t) => t.getAttribute("aria-checked"))).toEqual(["true", "false", "false", "false", "false"]);
      expect(tones(el).map((t) => t.tabIndex)).toEqual([0, -1, -1, -1, -1]);
      const described = tone(el, "default").getAttribute("aria-describedby")!.split(" ").map((id) => document.getElementById(id)!.textContent);
      expect(described).toEqual([defaultTones[0].description, `“${defaultTones[0].sample}”`]);
      expect(tone(el, "direct").getAttribute("aria-describedby")!.split(" ")).toHaveLength(1);
    });

    test("a click or the arrow keys pick a tone and fire tc-tone-change; prevented, it stays", async () => {
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} .memories=${[tea]}></tc-memory-panel>`);
      const seen: string[] = [];
      let block = false;
      el.addEventListener("tc-tone-change", (e) => {
        seen.push((e as CustomEvent<{ tone: string }>).detail.tone);
        if (block) e.preventDefault();
      });
      tone(el, "direct").click();
      await settle();
      expect(el.tone).toBe("direct");
      expect(el.querySelector(".ui-mp__sample-text")!.textContent).toBe(`“${defaultTones[3].sample}”`);
      tone(el, "direct").focus();
      key(tone(el, "direct"), "ArrowDown");
      await settle();
      expect(el.tone).toBe("thorough");
      await expect.poll(() => document.activeElement).toBe(tone(el, "thorough"));
      key(tone(el, "thorough"), "ArrowDown");
      await settle();
      expect(el.tone).toBe("default");
      key(tone(el, "default"), "End");
      await settle();
      expect(el.tone).toBe("thorough");
      key(tone(el, "thorough"), "Home");
      await settle();
      expect(el.tone).toBe("default");
      expect(seen).toEqual(["direct", "thorough", "default", "thorough", "default"]);
      block = true;
      tone(el, "friendly").click();
      await settle();
      expect(el.tone).toBe("default");
      expect(tone(el, "friendly").getAttribute("aria-checked")).toBe("false");
    });

    test("instructions: labelled, counted, capped at instructions-max; tc-instructions-change; prevented, they go back", async () => {
      const el = await fixture<TcMemoryPanel>(html`<tc-memory-panel look=${look} instructions-max="40" .memories=${[tea]}></tc-memory-panel>`);
      const f = field(el);
      expect(el.querySelector(`label[for="${f.id}"]`)!.textContent).toBe("Anything else it should know about how to answer you?");
      expect(f.maxLength).toBe(40);
      const count = () => document.getElementById(f.getAttribute("aria-describedby")!)!;
      expect(count().textContent).toBe("0 / 40 characters");
      const seen: string[] = [];
      let block = false;
      el.addEventListener("tc-instructions-change", (e) => {
        seen.push((e as CustomEvent<{ instructions: string }>).detail.instructions);
        if (block) e.preventDefault();
      });
      type(f, "Use plain words.");
      await settle();
      expect(el.instructions).toBe("Use plain words.");
      expect(count().textContent).toBe("16 / 40 characters");
      expect(count().hasAttribute("data-full")).toBe(false);
      type(f, "x".repeat(60));
      await settle();
      expect(el.instructions).toBe("x".repeat(40));
      expect(count().hasAttribute("data-full")).toBe(true);
      block = true;
      type(f, "Something else");
      await settle();
      expect(seen.at(-1)).toBe("Something else");
      expect(el.instructions).toBe("x".repeat(40));
      await expect.poll(() => f.value).toBe("x".repeat(40));
    });

    test("tones replace the defaults; hide-personality leaves the section out", async () => {
      const el = await fixture<TcMemoryPanel>(
        html`<tc-memory-panel look=${look} tone="brief" .memories=${[tea]} .tones=${[
          { id: "plain", label: "Plain", description: "Everyday words", sample: "Two transfers match." },
          { id: "brief", label: "Brief", description: "As short as it can be", sample: "2 matches." },
        ]}></tc-memory-panel>`,
      );
      expect(tones(el).map((t) => t.getAttribute("aria-checked"))).toEqual(["false", "true"]);
      expect(el.querySelector(".ui-mp__sample-text")!.textContent).toBe("“2 matches.”");
      el.hidePersonality = true;
      await settle();
      expect(el.querySelector(".ui-mp__persona")).toBeNull();
    });
  });

test("React: tone and instructions are controllable, and uncontrolled they start at their defaults", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const tonesSeen: string[] = [];
  const said: string[] = [];
  // Controlled: a pick is reported, not applied, until the parent passes it back
  await act(async () =>
    root.render(
      React.createElement(MemoryPanel, { defaultMemories: [tea], tone: "professional", onToneChange: (t) => tonesSeen.push(t), defaultInstructions: "Be brief", onInstructionsChange: (i) => said.push(i) }),
    ),
  );
  await settle();
  const el = host.querySelector<TcMemoryPanel>("tc-memory-panel")!;
  expect(el.tone).toBe("professional");
  tone(el, "friendly").click();
  await act(async () => settle());
  expect(tonesSeen).toEqual(["friendly"]);
  expect(el.tone).toBe("professional");
  // Uncontrolled instructions: kept by the panel
  expect(field(el).value).toBe("Be brief");
  type(field(el), "Be brief and cite sources");
  await act(async () => settle());
  expect(said).toEqual(["Be brief and cite sources"]);
  expect(el.instructions).toBe("Be brief and cite sources");
  await act(async () => root.unmount());
  host.remove();
});

for (const theme of ["light", "dark"] as const)
  test(`axe (${theme}): personality in both looks`, async () => {
    const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
      <tc-memory-panel tone="direct" instructions="Lead with the decision." .memories=${[tea]}></tc-memory-panel>
      <tc-memory-panel look="clean" heading="Clean" tone="thorough" .memories=${[tea]}></tc-memory-panel>
    </div>`);
    await finish(wrap);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
