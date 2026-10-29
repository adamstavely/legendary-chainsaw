/*
 * <tc-color-picker> in real browsers: the colour maths, the structure in both looks, the square and sliders by
 * pointer and keyboard, the HEX / RGB / CMYK fields with errors, swatches, the previous colour, Copy, the eyedropper
 * where there is one, preventDefault on every event, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/color-picker";
import {
  colorCmykToRgb,
  colorRgbToCmyk,
  colorToHex,
  parseColorHex,
  type ColorPickerCopy,
  type ColorPickerFormatChange,
  type ColorPickerValueChange,
  type TcColorPicker,
} from "../../src/elements/color-picker";
import { ColorPicker } from "../../src/elements/react/color-picker";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SWATCHES = [{ value: "#3a6df0", name: "Primary" }, { value: "#f97316", name: "Accent" }, "#0f9d76"];
const make = (look: "standard" | "clean" = "standard", extra: Partial<TcColorPicker> = {}) =>
  fixture<TcColorPicker>(html`<tc-color-picker look=${look} value="#3a6df0" .swatches=${SWATCHES} .eyedropper=${extra.eyedropper ?? true} ?alpha=${extra.alpha ?? false}></tc-color-picker>`);
const changes = (el: Element) => {
  const seen: ColorPickerValueChange[] = [];
  el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<ColorPickerValueChange>).detail));
  return seen;
};
const q = <T extends Element = HTMLElement>(el: Element, sel: string) => el.querySelector<T>(sel)!;
const type = async (el: Element, field: string, text: string, key: "Enter" | "Escape" | null = "Enter") => {
  const input = q<HTMLInputElement>(el, `[data-field="${field}"] input`);
  input.focus();
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
  if (key) input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  await settle();
};
const press = async (target: Element, key: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const pickFormat = async (el: Element, format: "hex" | "rgb" | "cmyk") => {
  const i = ["hex", "rgb", "cmyk"].indexOf(format);
  q(el, "tc-segmented-control").querySelectorAll<HTMLElement>('[role="radio"]')[i].click();
  await settle();
};

describe("colour maths", () => {
  test("hex parsing in every length, formatting, and CMYK both ways", () => {
    expect(parseColorHex("#3a6df0")).toEqual({ r: 58, g: 109, b: 240, a: 1 });
    expect(parseColorHex("36F")).toEqual({ r: 51, g: 102, b: 255, a: 1 });
    expect(parseColorHex("#3a6df080")).toEqual({ r: 58, g: 109, b: 240, a: 0.5 });
    expect(parseColorHex("#0008")).toEqual({ r: 0, g: 0, b: 0, a: 0.53 });
    for (const bad of ["", "#12", "#12345", "blue", "#ggg", null]) expect(parseColorHex(bad)).toBeNull();
    expect(colorToHex({ r: 58, g: 109, b: 240, a: 0.5 })).toBe("#3a6df0");
    expect(colorToHex({ r: 58, g: 109, b: 240, a: 0.5 }, true)).toBe("#3a6df080");
    expect(colorRgbToCmyk({ r: 58, g: 109, b: 240 })).toEqual({ c: 76, m: 55, y: 0, k: 6 });
    expect(colorRgbToCmyk({ r: 0, g: 0, b: 0 })).toEqual({ c: 0, m: 0, y: 0, k: 100 });
    expect(colorRgbToCmyk({ r: 255, g: 255, b: 255 })).toEqual({ c: 0, m: 0, y: 0, k: 0 });
    expect(colorCmykToRgb({ c: 0, m: 100, y: 100, k: 0 })).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(colorCmykToRgb({ c: 0, m: 0, y: 0, k: 50 })).toEqual({ r: 128, g: 128, b: 128, a: 1 });
  });
});

describe("tc-color-picker", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: header, the square and hue sliders, preview, format, fields, Copy and swatches`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("clp");
      expect(el.dataset.look).toBe(look);
      expect(q(el, ".tc-head__title").textContent).toBe("Colour");
      const card = q(el, ".ui-clp__card");
      expect(card.getAttribute("role")).toBe("group");
      expect(card.getAttribute("aria-labelledby")).toBe(q(el, ".tc-head__title").id);
      const sliders = [...el.querySelectorAll<HTMLElement>('[role="slider"]')];
      expect(sliders.map((s) => s.getAttribute("aria-label"))).toEqual(["Saturation and brightness", "Hue"]);
      const area = sliders[0];
      expect(area.getAttribute("aria-valuetext")).toBe("saturation 76%, brightness 94%, blue");
      expect(document.getElementById(area.getAttribute("aria-describedby")!)!.textContent).toContain("Hold Shift");
      expect(sliders[1].getAttribute("aria-valuenow")).toBe("223");
      expect(sliders[1].getAttribute("aria-valuetext")).toBe("223 degrees, blue");
      expect(q(el, 'tc-segmented-control [role="radiogroup"]').getAttribute("aria-label")).toBe("Format");
      expect(q(el, "tc-segmented-control").getAttribute("look")).toBe(look);
      expect([...el.querySelectorAll(".ui-clp__field")].map((f) => f.textContent!.replace(/\s+/g, " ").trim())).toEqual(["HEXHex"]);
      expect(q<HTMLInputElement>(el, '[data-field="hex"] input').value).toBe("#3a6df0");
      expect(q(el, ".ui-clp__copy").textContent!.trim()).toBe("Copy #3a6df0");
      expect(q(el, ".ui-clp__chip--new").getAttribute("aria-label")).toBe("New colour #3a6df0, blue");
      expect(q(el, ".ui-clp__chip--previous").textContent!.trim()).toBe("Previous colour #3a6df0, put it back");
      const swatches = [...el.querySelectorAll<HTMLElement>(".ui-clp__swatch")];
      expect(q(el, ".ui-clp__swatches").getAttribute("role")).toBe("radiogroup");
      expect(swatches.map((s) => s.getAttribute("aria-label"))).toEqual(["Primary, #3a6df0", "Accent, #f97316", "#0f9d76"]);
      expect(swatches.map((s) => s.getAttribute("aria-checked"))).toEqual(["true", "false", "false"]);
      expect(swatches.map((s) => s.tabIndex)).toEqual([0, -1, -1]);
      // One tab stop per slider, the fields and buttons in order, one for the swatches
      expect([...el.querySelectorAll<HTMLElement>("[tabindex='0'], button:not([tabindex]), input")].length).toBeGreaterThan(5);
      // No alpha: no opacity slider or field
      expect(el.querySelector(".ui-clp__alpha")).toBeNull();
      expect(el.querySelector('[data-field="a"]')).toBeNull();
    });
  }

  test("the square and hue by keyboard: arrows, Shift, Page and Home / End; the hue survives black", async () => {
    const el = await make();
    const seen = changes(el);
    const area = q(el, ".ui-clp__area");
    // #3a6df0 is s 76 v 94
    await press(area, "ArrowLeft");
    expect(area.getAttribute("aria-valuetext")).toBe("saturation 75%, brightness 94%, blue");
    await press(area, "ArrowDown", { shiftKey: true });
    expect(area.getAttribute("aria-valuetext")).toBe("saturation 75%, brightness 84%, blue");
    await press(area, "Home");
    expect(el.value).toBe("#d6d6d6");
    expect(area.getAttribute("aria-valuetext")).toContain("gray");
    await press(area, "End");
    await press(area, "PageDown");
    expect(seen.length).toBe(5);
    expect(seen.at(-1)!.value).toBe(el.value);
    expect(seen.at(-1)!.rgb).toEqual({ ...parseColorHex(el.value)!, a: 1 });
    expect(seen.at(-1)!.cmyk).toEqual(colorRgbToCmyk(parseColorHex(el.value)!));
    const hue = q(el, ".ui-clp__hue");
    await press(hue, "Home");
    expect(hue.getAttribute("aria-valuetext")).toBe("0 degrees, red");
    await press(hue, "ArrowRight", { shiftKey: true });
    expect(hue.getAttribute("aria-valuenow")).toBe("10");
    await press(hue, "End");
    expect(hue.getAttribute("aria-valuenow")).toBe("360");
    // Black keeps the hue where it was
    el.value = "#000000";
    await settle();
    expect(hue.getAttribute("aria-valuenow")).toBe("360");
    // Unrelated keys do nothing
    const n = seen.length;
    await press(area, "a");
    expect(seen.length).toBe(n);
  });

  test("dragging the square and the hue with a pointer", async () => {
    const el = await make();
    const seen = changes(el);
    const area = q(el, ".ui-clp__area");
    const box = area.getBoundingClientRect();
    const at = (x: number, y: number, type: string) =>
      area.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, clientX: box.left + box.width * x, clientY: box.top + box.height * y }));
    at(1, 0, "pointerdown");
    await settle();
    expect(document.activeElement).toBe(area);
    // Top right: full saturation and brightness of hue 223
    expect(area.getAttribute("aria-valuetext")).toBe("saturation 100%, brightness 100%, blue");
    at(0, 1, "pointermove");
    await settle();
    expect(el.value).toBe("#000000");
    at(0, 1, "pointerup");
    at(1, 0, "pointermove");
    await settle();
    // After pointerup a move does nothing
    expect(el.value).toBe("#000000");
    expect(seen.length).toBe(2);
    const hue = q(el, ".ui-clp__hue");
    const hb = hue.getBoundingClientRect();
    el.value = "#ff0000";
    await settle();
    hue.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 2, button: 0, clientX: hb.left + hb.width / 3, clientY: hb.top + 2 }));
    await settle();
    expect(el.value).toBe("#00ff00");
  });

  test("HEX, RGB and CMYK fields: typing commits on Enter, a bad value says what's wrong, Escape puts it back", async () => {
    const el = await make();
    const seen = changes(el);
    await type(el, "hex", "36f");
    expect(el.value).toBe("#3366ff");
    expect(seen.at(-1)!.value).toBe("#3366ff");
    await type(el, "hex", "#12zz");
    expect(el.value).toBe("#3366ff");
    expect(q(el, ".ui-clp__error").textContent).toBe("Enter a hex colour such as #3a6df0");
    const hex = q<HTMLInputElement>(el, '[data-field="hex"] input');
    expect(hex.getAttribute("aria-invalid")).toBe("true");
    expect(hex.getAttribute("aria-describedby")).toBe(q(el, ".ui-clp__error").id);
    expect(q(el, '[role="status"]').textContent).toBe("Enter a hex colour such as #3a6df0");
    await press(hex, "Escape");
    expect(hex.value).toBe("#3366ff");
    expect(el.querySelector(".ui-clp__error")).toBeNull();

    const formats: string[] = [];
    el.addEventListener("tc-format-change", (e) => formats.push((e as CustomEvent<ColorPickerFormatChange>).detail.format));
    await pickFormat(el, "rgb");
    expect(el.format).toBe("rgb");
    expect(formats).toEqual(["rgb"]);
    expect([...el.querySelectorAll<HTMLInputElement>(".ui-clp__input")].map((i) => i.value)).toEqual(["51", "102", "255"]);
    expect([...el.querySelectorAll(".ui-clp__field .tc-sr-only")].map((s) => s.textContent)).toEqual(["Red", "Green", "Blue"]);
    // Several fields at once: nothing commits while focus moves between them
    await type(el, "r", "255", null);
    await type(el, "g", "0", null);
    expect(el.value).toBe("#3366ff");
    await type(el, "b", "0");
    expect(el.value).toBe("#ff0000");
    await type(el, "g", "300");
    expect(q(el, ".ui-clp__error").textContent).toBe("Green takes a number from 0 to 255");
    expect(el.value).toBe("#ff0000");
    await press(q(el, '[data-field="g"] input'), "Escape");
    // Arrow keys step a number and apply it
    await press(q(el, '[data-field="g"] input'), "ArrowUp", { shiftKey: true });
    expect(el.value).toBe("#ff0a00");

    await pickFormat(el, "cmyk");
    expect([...el.querySelectorAll<HTMLInputElement>(".ui-clp__input")].map((i) => i.value)).toEqual(["0", "96", "100", "0"]);
    await type(el, "k", "50");
    expect(el.value).toBe("#800500");
    expect(q(el, ".ui-clp__copy").textContent!.trim()).toBe("Copy cmyk(0%, 96%, 100%, 50%)");
    // Focus leaving the fields commits
    const c = q<HTMLInputElement>(el, '[data-field="c"] input');
    c.focus();
    c.value = "100";
    c.dispatchEvent(new Event("input", { bubbles: true }));
    c.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: q(el, ".ui-clp__area") }));
    await settle();
    expect(el.value).toBe("#000500");
  });

  test("swatches: click or arrow keys pick, the tick follows the value; the previous colour puts it back", async () => {
    const el = await make();
    const seen = changes(el);
    const swatches = () => [...el.querySelectorAll<HTMLElement>(".ui-clp__swatch")];
    swatches()[1].click();
    await settle();
    expect(el.value).toBe("#f97316");
    expect(swatches().map((s) => s.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
    expect(swatches().map((s) => s.tabIndex)).toEqual([-1, 0, -1]);
    expect(swatches()[1].querySelector(".ui-clp__check")).not.toBeNull();
    await press(swatches()[1], "ArrowRight");
    expect(el.value).toBe("#0f9d76");
    expect(document.activeElement).toBe(swatches()[2]);
    await press(swatches()[2], "ArrowRight");
    expect(el.value).toBe("#3a6df0");
    await press(swatches()[0], "End");
    expect(el.value).toBe("#0f9d76");
    // A colour that isn't a swatch: none ticked, the first is the tab stop
    el.value = "#123456";
    await settle();
    expect(swatches().map((s) => s.getAttribute("aria-checked"))).toEqual(["false", "false", "false"]);
    expect(swatches()[0].tabIndex).toBe(0);
    q(el, ".ui-clp__chip--previous").click();
    await settle();
    expect(el.value).toBe("#3a6df0");
    expect(seen.map((s) => s.value)).toEqual(["#f97316", "#0f9d76", "#3a6df0", "#0f9d76", "#3a6df0"]);
    // `previous` given
    el.previous = "#ffffff";
    await settle();
    q(el, ".ui-clp__chip--previous").click();
    await settle();
    expect(el.value).toBe("#ffffff");
  });

  test("CMYK with alpha: changing only the opacity keeps the colour exactly", async () => {
    const el = await fixture<TcColorPicker>(html`<tc-color-picker value="#3a6df080" alpha></tc-color-picker>`);
    await pickFormat(el, "cmyk");
    await type(el, "a", "60");
    expect(el.value).toBe("#3a6df099");
  });

  test("alpha: an opacity slider and field, eight-digit values, a checkerboard behind", async () => {
    const el = await make("standard", { alpha: true });
    const seen = changes(el);
    const alpha = q(el, ".ui-clp__alpha");
    expect(alpha.getAttribute("aria-label")).toBe("Opacity");
    expect(alpha.getAttribute("aria-valuetext")).toBe("100%");
    await press(alpha, "ArrowLeft", { shiftKey: true });
    expect(el.value).toBe("#3a6df0e6");
    expect(seen.at(-1)!.rgb.a).toBe(0.9);
    expect(q<HTMLInputElement>(el, '[data-field="a"] input').value).toBe("90");
    await type(el, "a", "50");
    expect(el.value).toBe("#3a6df080");
    // An eight-digit hex sets the opacity too
    await type(el, "hex", "#ff000040");
    expect(el.value).toBe("#ff000040");
    expect(alpha.getAttribute("aria-valuetext")).toBe("25%");
    await pickFormat(el, "rgb");
    expect(q(el, ".ui-clp__copy").textContent!.trim()).toBe("Copy rgb(255 0 0 / 25%)");
    // Swatches without alpha are opaque
    q(el, ".ui-clp__swatch").click();
    await settle();
    expect(el.value).toBe("#3a6df0ff");
  });

  test("preventDefault keeps the value and the format; disabled and readonly", async () => {
    const el = await make();
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    el.addEventListener("tc-format-change", (e) => e.preventDefault());
    await press(q(el, ".ui-clp__area"), "ArrowLeft");
    expect(el.value).toBe("#3a6df0");
    expect(q(el, ".ui-clp__area").getAttribute("aria-valuetext")).toBe("saturation 76%, brightness 94%, blue");
    await type(el, "hex", "#000");
    expect(q<HTMLInputElement>(el, '[data-field="hex"] input').value).toBe("#3a6df0");
    await pickFormat(el, "rgb");
    expect(el.format).toBe("hex");
    expect(q(el, "tc-segmented-control").querySelector('[aria-checked="true"]')!.textContent).toContain("HEX");

    const ro = await fixture<TcColorPicker>(html`<tc-color-picker readonly value="#3a6df0" .swatches=${SWATCHES}></tc-color-picker>`);
    const seen = changes(ro);
    await press(q(ro, ".ui-clp__area"), "ArrowLeft");
    q(ro, ".ui-clp__swatch:nth-child(2)").click();
    await settle();
    expect(seen).toEqual([]);
    expect(q<HTMLInputElement>(ro, '[data-field="hex"] input').readOnly).toBe(true);
    expect(q(ro, ".ui-clp__area").tabIndex).toBe(0);
    expect(q<HTMLButtonElement>(ro, ".ui-clp__copy").disabled).toBe(false);

    const off = await fixture<TcColorPicker>(html`<tc-color-picker disabled value="#3a6df0"></tc-color-picker>`);
    expect(q(off, ".ui-clp__area").tabIndex).toBe(-1);
    expect(q(off, ".ui-clp__area").getAttribute("aria-disabled")).toBe("true");
    expect(q<HTMLInputElement>(off, '[data-field="hex"] input').disabled).toBe(true);
    off.querySelector(".ui-clp__area")!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    await settle();
    expect(off.value).toBe("#3a6df0");
  });

  test("Copy writes the value in the shown format; prevented, it doesn't", async () => {
    const el = await make();
    const copies: ColorPickerCopy[] = [];
    el.addEventListener("tc-copy", (e) => {
      copies.push((e as CustomEvent<ColorPickerCopy>).detail);
      e.preventDefault();
    });
    q(el, ".ui-clp__copy").click();
    await settle();
    expect(copies).toEqual([{ text: "#3a6df0", format: "hex" }]);
    expect(q(el, ".ui-clp__copy").hasAttribute("data-copied")).toBe(false);
    await pickFormat(el, "rgb");
    q(el, ".ui-clp__copy").click();
    await settle();
    expect(copies.at(-1)).toEqual({ text: "rgb(58 109 240)", format: "rgb" });
  });

  test("the eyedropper: shown only where the browser has one, an aborted pick is quiet", async () => {
    const g = globalThis as { EyeDropper?: unknown };
    const had = g.EyeDropper;
    try {
      g.EyeDropper = undefined;
      let el = await make();
      expect(el.querySelector(".ui-clp__eyedropper")).toBeNull();
      let answer: () => Promise<{ sRGBHex: string }> = async () => ({ sRGBHex: "#10a37f" });
      g.EyeDropper = class {
        open() {
          return answer();
        }
      };
      el = await make();
      const btn = q<HTMLButtonElement>(el, ".ui-clp__eyedropper");
      expect(btn.textContent!.trim()).toBe("Pick from screen");
      btn.click();
      await expect.poll(() => el.value).toBe("#10a37f");
      answer = async () => {
        throw new DOMException("cancelled", "AbortError");
      };
      btn.click();
      await settle();
      expect(q(el, '[role="status"]').textContent).toBe("");
      answer = async () => {
        throw new Error("nope");
      };
      btn.click();
      await expect.poll(() => q(el, '[role="status"]').textContent).toBe("Couldn't pick a colour from the screen");
      // Turned off
      el.eyedropper = false;
      await settle();
      expect(el.querySelector(".ui-clp__eyedropper")).toBeNull();
    } finally {
      g.EyeDropper = had;
    }
  });

  test("renamed labels; a bad value keeps the last good colour; narrow width wraps the fields", async () => {
    const el = await fixture<TcColorPicker>(html`<div style="width: 260px"><tc-color-picker value="#3a6df0" format="cmyk" .labels=${{ heading: "Farbe", cyan: "Cyan-Anteil", formats: { cmyk: "CMYK!" } }}></tc-color-picker></div>`);
    const picker = el.querySelector("tc-color-picker")!;
    await settle();
    expect(q(picker, ".tc-head__title").textContent).toBe("Farbe");
    expect(q(picker, '[data-field="c"] .tc-sr-only').textContent).toBe("Cyan-Anteil");
    expect(q(picker, "tc-segmented-control").textContent).toContain("CMYK!");
    expect(q(picker, "tc-segmented-control").textContent).toContain("HEX");
    picker.value = "not a colour";
    await settle();
    expect(q<HTMLInputElement>(picker, '[data-field="c"] input').value).toBe("76");
    const fields = [...picker.querySelectorAll<HTMLElement>(".ui-clp__field")];
    expect(fields[2].getBoundingClientRect().top).toBeGreaterThan(fields[0].getBoundingClientRect().top);
    expect(q(picker, ".ui-clp__area").getBoundingClientRect().height).toBeLessThan(150);
  });

  test("React wrapper: uncontrolled edits survive parent re-renders; onValueChange gets the detail", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const got: [string, ColorPickerValueChange][] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ColorPicker, {
        title: "Primary colour",
        defaultValue: "#3a6df0",
        swatches: SWATCHES,
        onValueChange: (v, d) => void got.push([v, d]),
        "data-n": n,
      } as React.ComponentProps<typeof ColorPicker>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-color-picker")!;
    expect(q(el, ".tc-head__title").textContent).toBe("Primary colour");
    q(el, ".ui-clp__swatch:nth-child(2)").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.value).toBe("#f97316");
    expect(got.at(-1)![0]).toBe("#f97316");
    expect(got.at(-1)![1].cmyk).toEqual(colorRgbToCmyk({ r: 249, g: 115, b: 22 }));
    // Format uncontrolled too
    await pickFormat(el, "cmyk");
    await act(async () => bump());
    await settle();
    expect(el.format).toBe("cmyk");
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled value and format stay until the parent changes them", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[] = [];
    const formats: string[] = [];
    const copied: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(ColorPicker, {
          value: "#3a6df0",
          onValueChange: (v) => void asked.push(v),
          format: "hex",
          onFormatChange: (f) => void formats.push(f),
          onCopyColor: (t) => {
            copied.push(t);
            return false;
          },
          swatches: SWATCHES,
        }),
      ),
    );
    await settle();
    const el = host.querySelector("tc-color-picker")!;
    q(el, ".ui-clp__swatch:nth-child(2)").click();
    await settle();
    expect(asked).toEqual(["#f97316"]);
    expect(el.value).toBe("#3a6df0");
    expect(q<HTMLInputElement>(el, '[data-field="hex"] input').value).toBe("#3a6df0");
    await pickFormat(el, "rgb");
    expect(formats).toEqual(["rgb"]);
    expect(el.format).toBe("hex");
    q(el, ".ui-clp__copy").click();
    await settle();
    expect(copied).toEqual(["#3a6df0"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with alpha and an error showing`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); display: grid; gap: 16px">
        <tc-color-picker value="#3a6df0" description="Brand theme" .swatches=${SWATCHES}></tc-color-picker>
        <tc-color-picker look="clean" alpha format="rgb" value="#f9731680" .swatches=${SWATCHES}></tc-color-picker>
      </div>`);
      await type(wrap.querySelectorAll("tc-color-picker")[1], "r", "999");
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
