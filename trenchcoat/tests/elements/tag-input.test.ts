/*
 * <tc-tag-input> in real browsers: adding with Enter, comma, Tab and paste, the rules (unique, max, allow-custom,
 * validate) and tc-invalid-tag, suggestions as a combobox, removing by Backspace, by chip keys and by ×, the form,
 * controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/tag-input";
import { splitTags, type TagInputValueChange, type TagInvalid, type TcTagInput } from "../../src/elements/tag-input";
import { TagInput } from "../../src/elements/react/tag-input";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const HEADINGS = ["Archives", "Cartography", "Harbours", "Hydrography", "Tides"];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const input = (el: TcTagInput) => el.querySelector<HTMLInputElement>(".ui-tgi__input")!;
const chips = (el: TcTagInput) => [...el.querySelectorAll(".ui-tgi__chip-label")].map(text);
const type = async (el: TcTagInput, value: string) => {
  const i = input(el);
  i.focus();
  i.value = value;
  i.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
const status = (el: TcTagInput) => text(el.querySelector('[role="status"]'));

describe("tc-tag-input", () => {
  test("splitTags splits on commas and new lines and trims", () => {
    expect(splitTags(" a, b\nc ,, \r\nd ")).toEqual(["a", "b", "c", "d"]);
  });

  for (const look of ["standard", "clean"]) {
    test(`${look}: a labelled input with chips as a list; the input is the one tab stop`, async () => {
      const el = await fixture<TcTagInput>(html`<tc-tag-input look=${look} label="Keywords" .value=${["Tides", "Harbours"]}></tc-tag-input>`);
      expect(el.dataset.ui).toBe("tgi");
      expect(el.dataset.look).toBe(look);
      expect(document.getElementById(input(el).getAttribute("aria-labelledby")!)!.textContent).toBe("Keywords");
      expect(el.querySelector(".ui-tgi__chips")!.getAttribute("aria-label")).toBe("Keywords, added");
      expect(chips(el)).toEqual(["Tides", "Harbours"]);
      // Without suggestions it's a plain text box
      expect(input(el).hasAttribute("role")).toBe(false);
      expect([...el.querySelectorAll("button")].every((b) => b.tabIndex === -1)).toBe(true);
      expect(el.querySelector(".ui-tgi__x")!.getAttribute("aria-label")).toBe("Remove Tides");
    });
  }

  test("Enter, comma and Tab add what's typed; tc-value-change says what was added; prevented, nothing changes", async () => {
    const el = await fixture<TcTagInput>(html`<tc-tag-input label="Keywords"></tc-tag-input>`);
    const changes: TagInputValueChange[] = [];
    el.addEventListener("tc-value-change", (e) => changes.push((e as CustomEvent<TagInputValueChange>).detail));
    await type(el, " quay ");
    key(input(el), "Enter");
    await settle();
    await type(el, "survey");
    key(input(el), ",");
    await settle();
    await type(el, "tide notes");
    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    input(el).dispatchEvent(tab);
    await settle();
    expect(tab.defaultPrevented).toBe(true);
    expect(chips(el)).toEqual(["quay", "survey", "tide notes"]);
    expect(changes[0]).toEqual({ value: ["quay"], added: ["quay"] });
    expect(input(el).value).toBe("");
    expect(status(el)).toBe("Added tide notes. 3 tags");
    // Tab with nothing typed moves on
    const empty = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    input(el).dispatchEvent(empty);
    expect(empty.defaultPrevented).toBe(false);
    el.addEventListener("tc-value-change", (e) => e.preventDefault(), { once: true });
    await type(el, "kept out");
    key(input(el), "Enter");
    await settle();
    expect(chips(el)).toEqual(["quay", "survey", "tide notes"]);
  });

  test("rules: duplicates (any case), max, allow-custom and validate refuse with a reason and tc-invalid-tag", async () => {
    const el = await fixture<TcTagInput>(html`<tc-tag-input label="Keywords" max="3" .value=${["Tides"]} .suggestions=${HEADINGS} .validate=${(t: string) => (t.length < 3 ? "Too short." : undefined)}></tc-tag-input>`);
    const refused: TagInvalid[] = [];
    el.addEventListener("tc-invalid-tag", (e) => refused.push((e as CustomEvent<TagInvalid>).detail));
    await type(el, "tides");
    // No suggestion is left for it (Tides is added), so Enter adds the typed text – a duplicate
    expect(el.querySelector("[role=listbox]")).toBeNull();
    key(input(el), "Enter");
    await settle();
    expect(refused.map((r) => r.reason)).toEqual(["duplicate"]);
    const err = el.querySelector(".ui-tgi__error")!;
    expect(text(err)).toBe("“Tides” is already added.");
    expect(input(el).getAttribute("aria-invalid")).toBe("true");
    expect(input(el).getAttribute("aria-describedby")).toContain(err.id);
    expect(input(el).value).toBe("tides");
    await type(el, "ab");
    expect(el.querySelector(".ui-tgi__error")!.hasAttribute("hidden")).toBe(true);
    key(input(el), "Enter");
    await settle();
    expect(refused[1]).toEqual({ text: "ab", reason: "invalid", message: "Too short." });
    // A suggestion typed in another case takes its spelling
    await type(el, "harbours");
    key(input(el), "Enter");
    await settle();
    await type(el, "quay");
    key(input(el), "Enter");
    await settle();
    expect(chips(el)).toEqual(["Tides", "Harbours", "quay"]);
    await type(el, "more");
    key(input(el), "Enter");
    await settle();
    expect(refused[2].reason).toBe("max");
    expect(text(el.querySelector(".ui-tgi__error"))).toBe("You can add up to 3 tags.");
    el.max = undefined;
    el.allowCustom = false;
    await type(el, "anything");
    key(input(el), "Enter");
    await settle();
    expect(refused[3].reason).toBe("not-allowed");
  });

  test("suggestions: a combobox listbox filtered by what's typed, without what's added; ↓ ↑ and Enter pick", async () => {
    const el = await fixture<TcTagInput>(html`<tc-tag-input label="Headings" .value=${["Harbours"]} .suggestions=${HEADINGS}></tc-tag-input>`);
    const i = input(el);
    expect(i.getAttribute("role")).toBe("combobox");
    expect(i.getAttribute("aria-expanded")).toBe("false");
    await type(el, "ra");
    const list = el.querySelector("[role=listbox]")!;
    expect(i.getAttribute("aria-controls")).toBe(list.id);
    expect([...list.querySelectorAll("[role=option]")].map(text)).toEqual(["Cartography", "Hydrography"]);
    expect(text(list.querySelector("mark"))).toBe("ra");
    key(i, "ArrowDown");
    await settle();
    expect(document.getElementById(i.getAttribute("aria-activedescendant")!)!.textContent!.trim()).toBe("Hydrography");
    key(i, "Enter");
    await settle();
    expect(chips(el)).toEqual(["Harbours", "Hydrography"]);
    expect(el.querySelector("[role=listbox]")).toBeNull();
    // ↓ opens the whole list; a click picks
    key(i, "ArrowDown");
    await settle();
    expect(el.querySelectorAll("[role=option]").length).toBe(3);
    el.querySelector<HTMLElement>("[role=option]")!.click();
    await settle();
    expect(chips(el)).toEqual(["Harbours", "Hydrography", "Archives"]);
    // Escape closes the list, then clears what's typed
    await type(el, "t");
    expect(el.querySelector("[role=listbox]")).not.toBeNull();
    key(i, "Escape");
    await settle();
    expect(el.querySelector("[role=listbox]")).toBeNull();
    expect(i.value).toBe("t");
    key(i, "Escape");
    await settle();
    expect(i.value).toBe("");
  });

  test("paste splits on commas and new lines, keeping the unfinished last part", async () => {
    const el = await fixture<TcTagInput>(html`<tc-tag-input label="Keywords" .value=${["quay"]}></tc-tag-input>`);
    const i = input(el);
    i.focus();
    const paste = (data: string) => {
      const ev = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
      // A constructed event's clipboard is empty or missing in some browsers (Firefox): stand one in
      Object.defineProperty(ev, "clipboardData", { value: { getData: (type: string) => (type === "text/plain" ? data : "") } });
      i.dispatchEvent(ev);
    };
    paste("tides, survey\nQuay, harb");
    await settle();
    // "Quay" is a duplicate and is refused; "harb" stays to keep typing
    expect(chips(el)).toEqual(["quay", "tides", "survey"]);
    expect(i.value).toBe("harb");
    expect(text(el.querySelector(".ui-tgi__error"))).toBe("“Quay” is already added.");
  });

  test("removing: Backspace twice in the empty field, Delete on a focused chip, ← → between chips, ×", async () => {
    const el = await fixture<TcTagInput>(html`<tc-tag-input label="Keywords" .value=${["a1", "b2", "c3", "d4"]}></tc-tag-input>`);
    const removed: string[][] = [];
    el.addEventListener("tc-value-change", (e) => removed.push((e as CustomEvent<TagInputValueChange>).detail.removed ?? []));
    const i = input(el);
    i.focus();
    key(i, "Backspace");
    await settle();
    expect(el.querySelector(".ui-tgi__chip[data-armed]")).not.toBeNull();
    expect(status(el)).toBe("d4 – press Backspace again to remove");
    key(i, "Backspace");
    await settle();
    expect(chips(el)).toEqual(["a1", "b2", "c3"]);
    key(i, "ArrowLeft");
    await expect.poll(() => text(document.activeElement)).toBe("c3");
    key(document.activeElement!, "ArrowLeft");
    expect(text(document.activeElement)).toBe("b2");
    key(document.activeElement!, "Delete");
    await settle();
    expect(chips(el)).toEqual(["a1", "c3"]);
    // Focus stays on the chips: the one now in its place
    await expect.poll(() => text(document.activeElement)).toBe("c3");
    key(document.activeElement!, "ArrowRight");
    expect(document.activeElement).toBe(i);
    el.querySelector<HTMLButtonElement>(".ui-tgi__x")!.click();
    await settle();
    expect(chips(el)).toEqual(["c3"]);
    expect(removed).toEqual([["d4"], ["b2"], ["a1"]]);
    expect(status(el)).toBe("Removed a1. 1 tag");
  });

  test("form: one entry per tag, required needs one, reset brings back the first tags, disabled submits nothing", async () => {
    const form = await fixture<HTMLFormElement>(html`<form>
      <tc-tag-input name="kw" required .value=${["x"]}></tc-tag-input>
      <tc-tag-input name="off" disabled .value=${["y"]}></tc-tag-input>
    </form>`);
    const el = form.querySelector("tc-tag-input")!;
    expect(new FormData(form).getAll("kw")).toEqual(["x"]);
    expect(new FormData(form).getAll("off")).toEqual([]);
    el.value = ["x", "z"];
    await settle();
    expect(new FormData(form).getAll("kw")).toEqual(["x", "z"]);
    el.value = [];
    await settle();
    expect(form.checkValidity()).toBe(false);
    form.reset();
    await settle();
    expect(el.value).toEqual(["x"]);
    expect(form.checkValidity()).toBe(true);
  });

  test("React wrapper: uncontrolled tags survive re-renders; controlled tags stay until the parent changes them", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[][] = [];
    const bad: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(
        "div",
        { "data-n": n },
        React.createElement(TagInput, { label: "Own", defaultValue: ["a"], onInvalidTag: (t) => void bad.push(t.reason) }),
        React.createElement(TagInput, { label: "Held", value: ["h"], onChange: (v) => void seen.push(v) }),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const [own, held] = [...host.querySelectorAll("tc-tag-input")];
    await type(own, "b");
    key(input(own), "Enter");
    await settle();
    await type(own, "A");
    key(input(own), "Enter");
    await settle();
    await act(async () => bump());
    await settle();
    expect(own.value).toEqual(["a", "b"]);
    expect(bad).toEqual(["duplicate"]);
    await type(held, "k");
    key(input(held), "Enter");
    await settle();
    expect(seen).toEqual([["h", "k"]]);
    expect(held.value).toEqual(["h"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with suggestions open, an error and disabled`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px 16px 260px; background: var(--tc-surface-base); display: grid; gap: 16px">
        <tc-tag-input label="Keywords" .value=${["Tides", "Harbours"]}></tc-tag-input>
        <tc-tag-input look="clean" label="Duplicate" .value=${["Tides"]}></tc-tag-input>
        <tc-tag-input label="Disabled" disabled .value=${["Maps"]}></tc-tag-input>
        <tc-tag-input look="clean" label="Headings" .suggestions=${HEADINGS}></tc-tag-input>
      </div>`);
      const [, dup, , sug] = [...wrap.querySelectorAll<TcTagInput>("tc-tag-input")];
      await type(dup, "tides");
      key(input(dup), "Enter");
      await type(sug, "r");
      await settle();
      await finish(wrap);
      expect(sug.querySelector("[role=listbox]")).not.toBeNull();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
