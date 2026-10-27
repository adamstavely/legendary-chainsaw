/*
 * <tc-model-settings> in real browsers: supported parameters only, presets, conflict and ignored-value feedback, the
 * read-back of changes, controlled use, the form, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/model-settings";
import { formatModelParam, defaultModelParams, type ModelSettingsModel, type ModelSettingsValue, type TcModelSettings } from "../../src/elements/model-settings";
import { ModelSettings } from "../../src/elements/react/model-settings";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const GENERAL: ModelSettingsModel = { id: "g", label: "Atlas 2", description: "General model", supports: ["temperature", "topP", "maxOutputTokens"] };
const REASONING: ModelSettingsModel = {
  id: "r",
  label: "Atlas Reasoning",
  supports: ["reasoningEffort", "maxOutputTokens"],
  defaults: { maxOutputTokens: 8192 },
  ignores: { temperature: "Reasoning models choose their own sampling." },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- event details differ per test
const on = (el: Element, name: string, fn: (e: CustomEvent<Record<string, any>>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (value: ModelSettingsValue = {}, model: ModelSettingsModel | undefined = GENERAL, look: "standard" | "clean" = "standard") =>
  fixture<TcModelSettings>(html`<tc-model-settings look=${look} .model=${model} .value=${value}></tc-model-settings>`);
const param = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-mset__param[data-id="${id}"]`);
const range = (el: Element, id: string) => param(el, id)!.querySelector<HTMLInputElement>("input[type=range]")!;
const slide = (input: HTMLInputElement, v: number) => {
  input.value = String(v);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const segOption = (root: Element, label: string) =>
  [...root.querySelectorAll<HTMLButtonElement>(".ui-seg__opt")].find((b) => {
    const text = b.querySelector(".ui-seg__label")!.textContent!.trim();
    return text === label || text === label + label;
  })!;

describe("formatModelParam", () => {
  test("numbers at the step's precision, units, choice labels", () => {
    const [temp, , out, effort] = defaultModelParams;
    expect(formatModelParam(temp, 0.7)).toBe("0.7");
    expect(formatModelParam(temp, 1)).toBe("1.0");
    expect(formatModelParam(out, 4096)).toBe("4,096 tokens");
    expect(formatModelParam(effort, "high")).toBe("High");
  });
});

describe("tc-model-settings", () => {
  test("the host is a group named by the heading; both looks; the model's line", async () => {
    const el = await mount();
    expect(el.dataset.ui).toBe("mset");
    expect(el.getAttribute("role")).toBe("group");
    expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Model settings");
    // Standard: the header on the tray, above the card
    expect(el.querySelector(":scope > .tc-head + .ui-mset__card")).toBeTruthy();
    expect(el.querySelector(".tc-head__sub")!.textContent).toContain("Atlas 2 · General model");
    el.look = "clean";
    el.heading = "Reply drafts";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(".ui-mset__card")).toBeNull();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Reply drafts");
    expect(el.querySelector<HTMLElement>("tc-segmented-control")!.dataset.look).toBe("clean");
  });

  test("only the parameters the model supports, each explained; the rest are named as unavailable", async () => {
    const el = await mount({}, REASONING);
    expect([...el.querySelectorAll<HTMLElement>(".ui-mset__param")].map((p) => p.dataset.id)).toEqual(["maxOutputTokens", "reasoningEffort"]);
    expect(el.querySelector(".ui-mset__unsupported")!.textContent).toBe("Not available for Atlas Reasoning: temperature and top-p.");
    // The model's own default
    expect(range(el, "maxOutputTokens").value).toBe("8192");
    const input = range(el, "maxOutputTokens");
    expect(document.getElementById(input.getAttribute("aria-describedby")!)!.textContent).toContain("stops mid-sentence");
    expect(input.getAttribute("aria-valuetext")).toBe("8,192 tokens");
    // Reasoning effort promises nothing about the model's working beyond the answer
    expect(param(el, "reasoningEffort")!.textContent).toContain("its working isn't shown or kept");
    // Without a model every parameter shows
    el.model = undefined;
    await settle();
    expect(el.querySelectorAll(".ui-mset__param")).toHaveLength(4);
    expect(el.querySelector(".ui-mset__unsupported")).toBeNull();
  });

  test("a slider changes one value; Reset puts it back; the read-back lists what differs", async () => {
    const el = await mount();
    const seen: Record<string, unknown>[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail));
    expect(el.querySelector(".ui-mset__summary-text")!.textContent!.trim()).toBe("Everything is at Atlas 2's defaults.");
    expect(param(el, "temperature")!.querySelector(".ui-mset__is-default")!.textContent).toBe("Default");
    expect(param(el, "temperature")!.querySelector(".ui-mset__reset")).toBeNull();
    slide(range(el, "temperature"), 0.4);
    await settle();
    expect(seen[0]).toEqual({ value: { temperature: 0.4 }, changed: ["temperature"] });
    expect(param(el, "temperature")!.hasAttribute("data-changed")).toBe(true);
    expect(param(el, "temperature")!.querySelector(".ui-mset__value")!.textContent).toBe("0.4");
    expect(param(el, "temperature")!.querySelector(".ui-mset__is-default")!.textContent).toBe("Default 1.0");
    expect(el.querySelector(".ui-mset__summary-text")!.textContent!.replace(/\s+/g, " ").trim()).toBe("1 change from the defaults: Temperature 0.4, was 1.0");
    const reset = param(el, "temperature")!.querySelector<HTMLButtonElement>(".ui-mset__reset")!;
    expect(reset.getAttribute("aria-label")).toBe("Reset temperature to 1.0");
    reset.click();
    await settle();
    expect(el.value).toEqual({});
    expect(seen[1].changed).toEqual(["temperature"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Temperature reset to 1.0");
  });

  test("the signature: each shown value against its range, with the default and the presets marked", async () => {
    const el = await mount({ temperature: 0.2 });
    const profile = el.querySelector(".ui-mset__profile")!;
    expect(profile.getAttribute("aria-hidden")).toBe("true");
    const rows = [...profile.querySelectorAll<HTMLElement>(".ui-mset__sig-row")];
    expect(rows.map((r) => [r.querySelector(".ui-mset__sig-name")!.textContent, r.querySelector(".ui-mset__sig-val")!.textContent, r.hasAttribute("data-changed")])).toEqual([
      ["Temperature", "0.2", true],
      ["Top-p", "1.00", false],
      ["Output length", "4,096 tokens", false],
    ]);
    // Temperature 0.2 on 0–2 sits a tenth of the way; the presets mark their own values, Precise picked
    expect(rows[0].querySelector<HTMLElement>(".ui-mset__sig-dot")!.style.getPropertyValue("--at")).toBe("0.1");
    expect([...rows[0].querySelectorAll(".ui-mset__mk")].map((m) => [m.textContent, m.hasAttribute("data-on")])).toEqual([
      ["P", true],
      ["B", false],
      ["C", false],
    ]);
    expect(profile.querySelector(".ui-mset__legend")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Now Default PPreciseBBalancedCCreative");
    // A choice shows its options as cells
    el.model = REASONING;
    await settle();
    expect(el.querySelectorAll(".ui-mset__profile .ui-mset__pip")).toHaveLength(3);
    expect(el.querySelector(".ui-mset__profile .ui-mset__pip[data-on]")!.parentElement!.children.length).toBe(3);
  });

  test("keyboard: arrows on a slider are the browser's own range", async () => {
    const el = await mount();
    const input = range(el, "topP");
    input.focus();
    expect(input.type).toBe("range");
    expect([input.min, input.max, input.step]).toEqual(["0", "1", "0.05"]);
    expect(document.activeElement).toBe(input);
  });

  test("presets: the matching one is picked, Custom once values move, picking one applies only what the model supports", async () => {
    const el = await mount();
    const seg = el.querySelector(".ui-mset__presets tc-segmented-control")!;
    // Defaults (temperature 1) match no preset
    expect(el.preset).toBeNull();
    expect(segOption(seg, "Custom")).toBeTruthy();
    const outer: string[] = [];
    document.body.addEventListener("tc-value-change", (e) => outer.push((e.target as Element).tagName));
    segOption(seg, "Precise").click();
    await settle();
    // reasoningEffort isn't supported by Atlas 2, so it isn't set
    expect(el.value).toEqual({ temperature: 0.2 });
    expect(el.preset).toBe("precise");
    expect(outer).toEqual(["TC-MODEL-SETTINGS"]);
    expect(el.querySelector(".ui-mset__presets .ui-mset__hint")!.textContent).toContain("Nearly the same answer");
    slide(range(el, "temperature"), 0.3);
    await settle();
    expect(el.preset).toBeNull();
    expect(el.querySelector(".ui-mset__presets .ui-mset__hint")!.textContent).toContain("Your own values");
  });

  test("a choice parameter is a segmented control", async () => {
    const el = await mount({}, REASONING);
    const seg = param(el, "reasoningEffort")!.querySelector("tc-segmented-control")!;
    const group = seg.querySelector('[role="radiogroup"]')!;
    expect(document.getElementById(group.getAttribute("aria-labelledby")!)!.textContent).toBe("Reasoning effort");
    segOption(seg, "High").click();
    await settle();
    expect(el.value).toEqual({ reasoningEffort: "high" });
    expect(el.querySelector(".ui-mset__summary-text")!.textContent!.replace(/\s+/g, " ")).toContain("Reasoning effort High, was Medium");
  });

  test("feedback: conflicting changes and values the model ignores, with Clear", async () => {
    const el = await mount({ temperature: 0.4, topP: 0.9 });
    const issue = el.querySelector('.ui-mset__issue[data-kind="conflict"]')!;
    expect(issue.textContent).toContain("Temperature and top-p both change how varied answers are");
    expect(param(el, "temperature")!.hasAttribute("data-flagged")).toBe(true);
    // A reasoning model ignores the temperature that's still set
    el.model = REASONING;
    await settle();
    const ignored = el.querySelector('.ui-mset__issue[data-kind="ignored"]')!;
    expect(ignored.textContent).toContain("Atlas Reasoning ignores temperature (set to 0.4) – it's left out of requests. Reasoning models choose their own sampling.");
    expect(el.querySelector('.ui-mset__issue[data-kind="conflict"]')).toBeNull();
    expect(el.issues.map((i) => i.params[0])).toEqual(["temperature", "topP"]);
    ignored.querySelector<HTMLButtonElement>("button")!.click();
    await settle();
    expect(el.value).toEqual({ topP: 0.9 });
    // Own conflicts
    el.model = GENERAL;
    el.conflicts = [{ params: ["topP", "maxOutputTokens"], message: "Custom rule" }];
    el.value = { topP: 0.5, maxOutputTokens: 1024 };
    await settle();
    expect(el.querySelector(".ui-mset__issue")!.textContent).toContain("Custom rule");
  });

  test("Reset all; the form gets the supported values as JSON; reset and disabled", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><fieldset><tc-model-settings name="gen" .model=${GENERAL} .value=${{ temperature: 0.4 }}></tc-model-settings></fieldset></form>`);
    const el = form.querySelector<TcModelSettings>("tc-model-settings")!;
    expect(JSON.parse(new FormData(form).get("gen") as string)).toEqual({ temperature: 0.4, topP: 1, maxOutputTokens: 4096 });
    slide(range(el, "topP"), 0.5);
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-mset__reset-all")!.click();
    await settle();
    expect(el.value).toEqual({});
    form.reset();
    await settle();
    expect(el.value).toEqual({ temperature: 0.4 });
    form.querySelector("fieldset")!.disabled = true;
    await settle();
    await settle();
    expect(el.hasAttribute("data-disabled")).toBe(true);
    expect(new FormData(form).get("gen")).toBeNull();
    expect(range(el, "temperature").disabled).toBe(true);
  });

  test("controlled: preventDefault keeps the value", async () => {
    const el = await mount({ temperature: 0.4 });
    on(el, "tc-value-change", (e) => e.preventDefault());
    slide(range(el, "temperature"), 1.5);
    await settle();
    expect(el.value).toEqual({ temperature: 0.4 });
    expect(range(el, "temperature").value).toBe("0.4");
  });

  test("React wrapper: uncontrolled survives a re-render; controlled stays with the app; title and onChange(value, changed)", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    let rerender: () => void = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(ModelSettings, { title: "Drafts", model: GENERAL, onChange });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcModelSettings>("tc-model-settings")!;
    expect(el.heading).toBe("Drafts");
    await act(async () => slide(range(el, "temperature"), 0.5));
    await settle();
    expect(onChange).toHaveBeenCalledWith({ temperature: 0.5 }, ["temperature"]);
    await act(async () => rerender());
    await settle();
    expect(el.value).toEqual({ temperature: 0.5 });
    await act(async () => root.render(React.createElement(ModelSettings, { model: GENERAL, value: { temperature: 0.2 }, onChange })));
    await settle();
    const ctl = host.querySelector<TcModelSettings>("tc-model-settings")!;
    await act(async () => slide(range(ctl, "temperature"), 0.9));
    await settle();
    expect(onChange).toHaveBeenLastCalledWith({ temperature: 0.9 }, ["temperature"]);
    expect(ctl.value).toEqual({ temperature: 0.2 });
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <tc-model-settings .model=${GENERAL} .value=${{ temperature: 0.4, topP: 0.9 }}></tc-model-settings>
        <tc-model-settings look="clean" heading="Clean" .model=${REASONING} .value=${{ temperature: 0.4, reasoningEffort: "high" }}></tc-model-settings>
        <tc-model-settings look="clean" heading="Defaults" .model=${GENERAL}></tc-model-settings>
      </div>`);
      await settle();
      for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns animation off", () => {
    const css = (customElements.get("tc-model-settings") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\[data-ui="mset"\] \*/);
  });
});
