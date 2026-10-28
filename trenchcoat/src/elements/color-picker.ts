import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./segmented-control";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";

/*
 * <tc-color-picker> – a colour form control. A saturation and brightness square, a hue slider and, with `alpha`, an
 * opacity slider; the colour in HEX, RGB or CMYK fields (one set at a time, picked with a segmented control); an
 * eyedropper that picks from anywhere on screen where the browser has one (Chromium); a row of swatches; Copy; and a
 * chip with the new colour beside the previous one, which puts the previous one back.
 *   · `value` is a hex string – "#rrggbb", or "#rrggbbaa" with `alpha`; every change fires a cancelable
 *     tc-value-change ({ value, rgb, cmyk }) – call preventDefault() to control it
 *   · a field commits on Enter or when it loses focus; until what's typed is a colour it says what's wrong under the
 *     fields and the value stays as it was. Escape puts the field back
 *   · the square, the hue and opacity are sliders: arrow keys move them, Shift for big steps, Home / End and Page keys
 *     too. Dragging works with mouse, pen and touch
 *   · CMYK is a plain device-independent conversion from sRGB – not a print profile
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-color-picker value="#3a6df0" alpha .swatches=${["#3a6df0", { value: "#f97316", name: "Accent" }]}></tc-color-picker>
 */

export type ColorPickerFormat = "hex" | "rgb" | "cmyk";
/** Red, green and blue 0–255; alpha 0–1 */
export type ColorPickerRgb = { r: number; g: number; b: number; a: number };
/** Cyan, magenta, yellow and black (key), 0–100 */
export type ColorPickerCmyk = { c: number; m: number; y: number; k: number };
/** A swatch: a hex colour, or one with a name ("Primary") */
export type ColorPickerSwatch = string | { value: string; name?: string };

/** Details of the events */
export type ColorPickerValueChange = { value: string; rgb: ColorPickerRgb; cmyk: ColorPickerCmyk };
export type ColorPickerFormatChange = { format: ColorPickerFormat };
export type ColorPickerCopy = { text: string; format: ColorPickerFormat };

/** The picker's words, every one renameable through `labels` */
export type ColorPickerLabels = {
  heading: string;
  area: string;
  saturation: string;
  brightness: string;
  areaKeys: string;
  hue: string;
  /** "{n} degrees" */
  degrees: string;
  opacity: string;
  format: string;
  formats: Record<ColorPickerFormat, string>;
  hex: string;
  red: string;
  green: string;
  blue: string;
  cyan: string;
  magenta: string;
  yellow: string;
  black: string;
  eyedropper: string;
  pickFailed: string;
  copy: string;
  /** "Copied {text}" */
  copied: string;
  swatches: string;
  newColor: string;
  previous: string;
  usePrevious: string;
  /** Hue names for screen readers, from red round to pink */
  hueNames: [string, string, string, string, string, string, string, string];
  gray: string;
  invalidHex: string;
  /** "{field} takes a number from 0 to {max}" */
  invalidNumber: string;
};

export const defaultColorPickerLabels: ColorPickerLabels = {
  heading: "Colour",
  area: "Saturation and brightness",
  saturation: "saturation",
  brightness: "brightness",
  areaKeys: "Left and right arrows change saturation, up and down change brightness. Hold Shift for bigger steps.",
  hue: "Hue",
  degrees: "{n} degrees",
  opacity: "Opacity",
  format: "Format",
  formats: { hex: "HEX", rgb: "RGB", cmyk: "CMYK" },
  hex: "Hex",
  red: "Red",
  green: "Green",
  blue: "Blue",
  cyan: "Cyan",
  magenta: "Magenta",
  yellow: "Yellow",
  black: "Black",
  eyedropper: "Pick from screen",
  pickFailed: "Couldn't pick a colour from the screen",
  copy: "Copy",
  copied: "Copied {text}",
  swatches: "Swatches",
  newColor: "New colour",
  previous: "Previous colour",
  usePrevious: "put it back",
  hueNames: ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink"],
  gray: "gray",
  invalidHex: "Enter a hex colour such as #3a6df0",
  invalidNumber: "{field} takes a number from 0 to {max}",
};

/* ---------- Colour maths (sRGB, no library) ---------- */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const hex2 = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");

/** "#3a6df0", "3a6df0", "#36f", "#3a6df080" → rgb with alpha 0–1, or null when it isn't a hex colour */
export function parseColorHex(text: string | null | undefined): ColorPickerRgb | null {
  const m = /^\s*#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\s*$/i.exec(text ?? "");
  if (!m) return null;
  let h = m[1];
  if (h.length <= 4) h = [...h].map((c) => c + c).join("");
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? Math.round((n(6) / 255) * 100) / 100 : 1 };
}
/** rgb → "#rrggbb", or "#rrggbbaa" when `withAlpha` */
export function colorToHex({ r, g, b, a }: ColorPickerRgb, withAlpha = false) {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${withAlpha ? hex2(a * 255) : ""}`;
}
/** sRGB → CMYK percentages – a plain conversion, not a print profile */
export function colorRgbToCmyk({ r, g, b }: Pick<ColorPickerRgb, "r" | "g" | "b">): ColorPickerCmyk {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const k = 1 - Math.max(rr, gg, bb);
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
  const part = (x: number) => Math.round(((1 - x - k) / (1 - k)) * 100);
  return { c: part(rr), m: part(gg), y: part(bb), k: Math.round(k * 100) };
}
/** CMYK percentages → sRGB, alpha 1 */
export function colorCmykToRgb({ c, m, y, k }: ColorPickerCmyk): ColorPickerRgb {
  const ch = (x: number) => Math.round(255 * (1 - x / 100) * (1 - k / 100));
  return { r: ch(c), g: ch(m), b: ch(y), a: 1 };
}

type Hsva = { h: number; s: number; v: number; a: number };
function rgbToHsv({ r, g, b, a }: ColorPickerRgb, hue = 0): Hsva {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const d = max - Math.min(rr, gg, bb);
  let h = hue;
  if (d > 0) {
    if (max === rr) h = 60 * (((gg - bb) / d + 6) % 6);
    else if (max === gg) h = 60 * ((bb - rr) / d + 2);
    else h = 60 * ((rr - gg) / d + 4);
  }
  return { h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100, a };
}
function hsvToRgb({ h, s, v, a }: Hsva): ColorPickerRgb {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round((v / 100) * (1 - (s / 100) * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
  };
  return { r: f(5), g: f(3), b: f(1), a };
}

/* ---------- The element ---------- */

type Field = "hex" | "r" | "g" | "b" | "c" | "m" | "y" | "k" | "a";
type Slider = "area" | "hue" | "alpha";

interface EyeDropperLike {
  open(): Promise<{ sRGBHex: string }>;
}
const eyeDropper = () => (globalThis as { EyeDropper?: new () => EyeDropperLike }).EyeDropper;

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and non-secure contexts
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0";
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

let uidCount = 0;

// Lucide "palette", "pipette", "copy" and "check" (ISC)
const paletteIcon = svg`<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>`;
const pipetteIcon = html`<svg class="ui-clp__glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/></svg>`;
const copyIcon = html`<svg class="ui-clp__glyph" viewBox="0 0 24 24" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const checkIcon = html`<svg class="ui-clp__check" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

/** Whether dark marks read better than light ones on this colour */
const isLight = ({ r, g, b, a }: ColorPickerRgb) => a < 0.5 || 0.2126 * r + 0.7152 * g + 0.0722 * b > 150;

/**
 * Pick a colour – a saturation and brightness square, hue and opacity sliders, HEX / RGB / CMYK fields, an eyedropper,
 * swatches and Copy.
 * @tag tc-color-picker
 * @fires tc-value-change - The colour changed ({ value, rgb, cmyk }: ColorPickerValueChange); cancelable – prevented, `value` stays as it was
 * @fires tc-format-change - Another format was picked ({ format }: ColorPickerFormatChange); cancelable – prevented, `format` stays as it was
 * @fires tc-copy - Copy was pressed ({ text, format }: ColorPickerCopy); cancelable – prevented, nothing is written to the clipboard
 */
export class TcColorPicker extends TcElement {
  static override ui = "clp";

  /** The heading; by default the labels' heading, "Colour" */
  @property() accessor heading = "";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The colour, "#rrggbb" – "#rrggbbaa" with `alpha`. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property() accessor value = "#000000";
  /** The colour shown beside the new one, which the chip puts back; by default the value when the element first rendered */
  @property() accessor previous: string | undefined = undefined;
  /** Which fields show: "hex", "rgb" or "cmyk". Changed by the user unless a tc-format-change listener calls preventDefault() */
  @property() accessor format: ColorPickerFormat = "hex";
  /** Adds an opacity slider and field; the value then carries alpha ("#rrggbbaa") */
  @property({ type: Boolean }) accessor alpha = false;
  /** Shows the eyedropper where the browser has one (Chromium); set false to hide it everywhere */
  @property({ type: Boolean }) accessor eyedropper = true;
  /** Colours to pick from in one press: hex strings, or { value, name } */
  @property({ attribute: false }) accessor swatches: ColorPickerSwatch[] = [];
  /** Nothing can be changed or focused except Copy */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** The colour shows and can be copied, but not changed */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;
  /** The picker's words, merged over defaultColorPickerLabels */
  @property({ attribute: false }) accessor labels: Partial<ColorPickerLabels> = {};

  /** The colour being shown, kept as hue/saturation/brightness so the hue survives grays and black */
  @state() private accessor hsva: Hsva = { h: 0, s: 0, v: 0, a: 1 };
  /** What's typed in a field and not committed yet */
  @state() private accessor drafts: Partial<Record<Field, string>> = {};
  @state() private accessor error = "";
  @state() private accessor announce = "";
  @state() private accessor copied = false;

  private uid = `tc-clp-${++uidCount}`;
  /** The hex the shown colour came from – an outside change to `value` is anything else */
  private shown = "";
  private first = "";
  private dragging: Slider | null = null;
  private copyTimer = 0;

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copyTimer);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if ((changed.has("value") || changed.has("alpha")) && this.normal(this.value) !== this.shown) {
      const rgb = parseColorHex(this.value);
      if (rgb) {
        // Grays and black have no hue of their own: keep the slider where it was
        this.hsva = rgbToHsv(this.alpha ? rgb : { ...rgb, a: 1 }, this.hsva.h);
        this.shown = this.normal(this.value);
        this.drafts = {};
        this.error = "";
      }
    }
    if (!this.hasUpdated) this.first = this.normal(this.value);
  }

  /* ---------- The model ---------- */

  private get l(): ColorPickerLabels {
    const l = this.labels;
    return { ...defaultColorPickerLabels, ...l, formats: { ...defaultColorPickerLabels.formats, ...l.formats } };
  }
  /** A hex in the element's own form, lower case, with alpha only when `alpha` is on */
  private normal(hex: string | undefined) {
    const rgb = parseColorHex(hex);
    return rgb ? colorToHex(rgb, this.alpha) : "";
  }
  private get rgb(): ColorPickerRgb {
    return hsvToRgb(this.alpha ? this.hsva : { ...this.hsva, a: 1 });
  }
  private get locked() {
    return this.disabled || this.readonly;
  }
  /** The colour as text in a format – what Copy writes */
  private text(format: ColorPickerFormat = this.format) {
    const rgb = this.rgb;
    const a = this.alpha ? Math.round(rgb.a * 100) : 100;
    if (format === "rgb") return a < 100 ? `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${a}%)` : `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
    if (format === "cmyk") {
      const c = colorRgbToCmyk(rgb);
      return `cmyk(${c.c}%, ${c.m}%, ${c.y}%, ${c.k}%)`;
    }
    return colorToHex(rgb, this.alpha);
  }
  /** "blue", "dark green", "gray" – words for a screen reader */
  private colourName(hsva: Hsva) {
    const l = this.l;
    if (hsva.v < 8) return l.black.toLowerCase();
    if (hsva.s < 10) return l.gray;
    const bounds = [15, 45, 70, 165, 195, 255, 290, 340];
    const i = bounds.findIndex((b) => hsva.h < b);
    return l.hueNames[i < 0 ? 0 : i];
  }

  /* ---------- Changes ---------- */

  /** Shows `next` and asks the page; a prevented change puts the shown colour back */
  private set(next: Hsva) {
    const before = this.hsva;
    const rgb = hsvToRgb(this.alpha ? next : { ...next, a: 1 });
    const value = colorToHex(rgb, this.alpha);
    if (value === this.shown) {
      // Same colour (a hue move on a gray, say): just move the slider
      this.hsva = next;
      return true;
    }
    this.hsva = next;
    if (!this.emit<ColorPickerValueChange>("tc-value-change", { value, rgb, cmyk: colorRgbToCmyk(rgb) }, { cancelable: true })) {
      this.hsva = before;
      return false;
    }
    this.shown = value;
    this.value = value;
    return true;
  }
  private setRgb(rgb: ColorPickerRgb) {
    return this.set(rgbToHsv(rgb, this.hsva.h));
  }

  private setFormat(format: ColorPickerFormat) {
    if (format === this.format) return;
    if (!this.emit<ColorPickerFormatChange>("tc-format-change", { format }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.format = format;
    this.drafts = {};
    this.error = "";
  }

  /* ---------- Sliders: the square, hue and opacity ---------- */

  private fromPointer(which: Slider, e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    const box = el.getBoundingClientRect();
    const x = box.width ? clamp((e.clientX - box.left) / box.width, 0, 1) : 0;
    const y = box.height ? clamp((e.clientY - box.top) / box.height, 0, 1) : 0;
    const c = this.hsva;
    if (which === "area") this.set({ ...c, s: x * 100, v: (1 - y) * 100 });
    else if (which === "hue") this.set({ ...c, h: x * 360 });
    else this.set({ ...c, a: Math.round(x * 100) / 100 });
  }
  private down = (which: Slider) => (e: PointerEvent) => {
    if (this.locked || e.button > 0) return;
    const el = e.currentTarget as HTMLElement;
    e.preventDefault();
    el.focus();
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // A pointer the browser doesn't know as active (a synthetic event) can't be captured
    }
    this.dragging = which;
    this.fromPointer(which, e);
  };
  private move = (which: Slider) => (e: PointerEvent) => {
    if (this.dragging === which) this.fromPointer(which, e);
  };
  private up = (e: PointerEvent) => {
    this.dragging = null;
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };
  private key = (which: Slider) => (e: KeyboardEvent) => {
    if (this.locked) return;
    const big = e.shiftKey;
    const c = this.hsva;
    const step = (n: number, lo: number, hi: number, by: number) => clamp(Math.round(n) + by, lo, hi);
    let next: Hsva | null = null;
    if (which === "area") {
      const d = big ? 10 : 1;
      if (e.key === "ArrowLeft") next = { ...c, s: step(c.s, 0, 100, -d) };
      else if (e.key === "ArrowRight") next = { ...c, s: step(c.s, 0, 100, d) };
      else if (e.key === "ArrowUp") next = { ...c, v: step(c.v, 0, 100, d) };
      else if (e.key === "ArrowDown") next = { ...c, v: step(c.v, 0, 100, -d) };
      else if (e.key === "PageUp") next = { ...c, v: step(c.v, 0, 100, 10) };
      else if (e.key === "PageDown") next = { ...c, v: step(c.v, 0, 100, -10) };
      else if (e.key === "Home") next = { ...c, s: 0 };
      else if (e.key === "End") next = { ...c, s: 100 };
    } else {
      const max = which === "hue" ? 360 : 100;
      const now = which === "hue" ? c.h : c.a * 100;
      let to: number | null = null;
      const d = big ? 10 : 1;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") to = step(now, 0, max, -d);
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") to = step(now, 0, max, d);
      else if (e.key === "PageDown") to = step(now, 0, max, -10);
      else if (e.key === "PageUp") to = step(now, 0, max, 10);
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = max;
      if (to !== null) next = which === "hue" ? { ...c, h: to } : { ...c, a: to / 100 };
    }
    if (!next) return;
    e.preventDefault();
    this.set(next);
  };

  /* ---------- Fields ---------- */

  private fieldValue(f: Field) {
    const d = this.drafts[f];
    if (d !== undefined) return d;
    const rgb = this.rgb;
    if (f === "hex") return colorToHex(rgb, this.alpha);
    if (f === "a") return String(Math.round(rgb.a * 100));
    if (f === "r" || f === "g" || f === "b") return String(rgb[f]);
    return String(colorRgbToCmyk(rgb)[f]);
  }
  private fieldName(f: Field) {
    const l = this.l;
    return { hex: l.hex, r: l.red, g: l.green, b: l.blue, c: l.cyan, m: l.magenta, y: l.yellow, k: l.black, a: l.opacity }[f];
  }
  /** Reads what's typed in the shown fields; a message when something isn't a number in range */
  private read(fields: Field[]): { values: Record<string, number>; problem: string } {
    const values: Record<string, number> = {};
    for (const f of fields) {
      const max = f === "r" || f === "g" || f === "b" ? 255 : 100;
      const text = this.fieldValue(f).trim().replace(/%$/, "");
      const n = Number(text);
      if (text === "" || !Number.isFinite(n) || n < 0 || n > max)
        return { values, problem: this.l.invalidNumber.replace("{field}", this.fieldName(f)).replace("{max}", String(max)) };
      values[f] = n;
    }
    return { values, problem: "" };
  }
  /** Commits what's typed in the current format's fields, or says what's wrong */
  private commitFields() {
    if (!Object.keys(this.drafts).length) return;
    const a = this.alpha ? this.read(["a"]) : { values: { a: 100 }, problem: "" };
    let rgb: ColorPickerRgb | null = null;
    let problem = a.problem;
    if (!problem) {
      if (this.format === "hex") {
        const parsed = parseColorHex(this.fieldValue("hex"));
        if (!parsed) problem = this.l.invalidHex;
        // An opacity typed into the hex wins over the opacity field only when the field wasn't edited
        else rgb = { ...parsed, a: this.drafts.a === undefined && /^\s*#?([0-9a-f]{4}|[0-9a-f]{8})\s*$/i.test(this.fieldValue("hex")) ? parsed.a : a.values.a / 100 };
      } else if (this.format === "rgb") {
        const r = this.read(["r", "g", "b"]);
        problem = r.problem;
        if (!problem) rgb = { r: Math.round(r.values.r), g: Math.round(r.values.g), b: Math.round(r.values.b), a: a.values.a / 100 };
      } else {
        const r = this.read(["c", "m", "y", "k"]);
        problem = r.problem;
        if (!problem) rgb = { ...colorCmykToRgb({ c: r.values.c, m: r.values.m, y: r.values.y, k: r.values.k }), a: a.values.a / 100 };
      }
    }
    if (problem || !rgb) {
      this.error = problem;
      this.announce = problem;
      return;
    }
    this.error = "";
    this.drafts = {};
    this.setRgb(rgb);
  }
  private fieldInput = (f: Field) => (e: Event) => {
    this.drafts = { ...this.drafts, [f]: (e.target as HTMLInputElement).value };
  };
  private fieldKey = (f: Field) => (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      this.commitFields();
    } else if (e.key === "Escape" && this.drafts[f] !== undefined) {
      e.preventDefault();
      const rest = { ...this.drafts };
      delete rest[f];
      this.drafts = rest;
      if (!Object.keys(rest).length) this.error = "";
    } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && f !== "hex" && !this.readonly) {
      // Numbers step like a spin button
      const max = f === "r" || f === "g" || f === "b" ? 255 : 100;
      const n = Number(this.fieldValue(f).replace(/%$/, ""));
      if (!Number.isFinite(n)) return;
      e.preventDefault();
      this.drafts = { ...this.drafts, [f]: String(clamp(Math.round(n) + (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : 1), 0, max)) };
      this.commitFields();
    }
  };

  /* ---------- Swatches, eyedropper, copy, previous ---------- */

  private get swatchList() {
    return this.swatches
      .map((s) => (typeof s === "string" ? { value: s, name: undefined } : s))
      .map((s) => ({ ...s, rgb: parseColorHex(s.value) }))
      .filter((s): s is { value: string; name: string | undefined; rgb: ColorPickerRgb } => !!s.rgb);
  }
  private pickSwatch(i: number, focus = false) {
    const s = this.swatchList[i];
    if (!s || this.locked) return;
    this.drafts = {};
    this.error = "";
    this.setRgb(this.alpha ? s.rgb : { ...s.rgb, a: 1 });
    if (focus) void this.updateComplete.then(() => this.querySelectorAll<HTMLElement>(".ui-clp__swatch")[i]?.focus());
  }
  private swatchKey = (i: number) => (e: KeyboardEvent) => {
    const n = this.swatchList.length;
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (to === null) return;
    e.preventDefault();
    this.pickSwatch(to, true);
  };
  private pick = async () => {
    const Ctor = eyeDropper();
    if (!Ctor || this.locked) return;
    try {
      const { sRGBHex } = await new Ctor().open();
      const rgb = parseColorHex(sRGBHex);
      if (rgb) {
        this.drafts = {};
        this.error = "";
        this.setRgb({ ...rgb, a: this.alpha ? this.hsva.a : 1 });
      }
    } catch (err) {
      // Escape or a click away cancels the pick: not an error
      if ((err as { name?: string })?.name !== "AbortError") this.announce = this.l.pickFailed;
    }
  };
  private copy = async () => {
    const text = this.text();
    if (!this.emit<ColorPickerCopy>("tc-copy", { text, format: this.format }, { cancelable: true })) return;
    if (!(await copyText(text))) return;
    this.copied = true;
    this.announce = this.l.copied.replace("{text}", text);
    clearTimeout(this.copyTimer);
    this.copyTimer = window.setTimeout(() => (this.copied = false), 1600);
  };
  private usePrevious = () => {
    const rgb = parseColorHex(this.previous ?? this.first);
    if (!rgb || this.locked) return;
    this.drafts = {};
    this.error = "";
    this.setRgb(this.alpha ? rgb : { ...rgb, a: 1 });
  };

  /* ---------- Rendering ---------- */

  private slider(which: Slider, label: string, now: number, max: number, text: string, extra: { describedby?: string; style?: string; cls: string; thumb: string }) {
    return html`<div
      class=${`ui-clp__slider ${extra.cls}`}
      role="slider"
      tabindex=${this.disabled ? -1 : 0}
      aria-label=${label}
      aria-valuemin="0"
      aria-valuemax=${max}
      aria-valuenow=${Math.round(now)}
      aria-valuetext=${text}
      aria-disabled=${this.disabled ? "true" : "false"}
      aria-describedby=${ifDefined(extra.describedby)}
      aria-orientation=${ifDefined(which === "area" ? undefined : "horizontal")}
      style=${ifDefined(extra.style)}
      @pointerdown=${this.down(which)}
      @pointermove=${this.move(which)}
      @pointerup=${this.up}
      @pointercancel=${this.up}
      @keydown=${this.key(which)}
    >
      <span class="ui-clp__thumb" style=${extra.thumb}></span>
    </div>`;
  }

  private field(f: Field, short: string) {
    const id = `${this.uid}-${f}`;
    const invalid = !!this.error && this.drafts[f] !== undefined;
    return html`<label class="ui-clp__field" data-field=${f} for=${id}>
      <input
        class="ui-clp__input"
        id=${id}
        type="text"
        inputmode=${f === "hex" ? "text" : "numeric"}
        autocomplete="off"
        spellcheck="false"
        .value=${live(this.fieldValue(f))}
        ?disabled=${this.disabled}
        ?readonly=${this.readonly}
        aria-invalid=${invalid ? "true" : "false"}
        aria-describedby=${ifDefined(invalid ? `${this.uid}-error` : undefined)}
        @input=${this.fieldInput(f)}
        @change=${() => this.commitFields()}
        @keydown=${this.fieldKey(f)}
      />
      <span class="ui-clp__field-label" aria-hidden="true">${short}</span><span class="tc-sr-only">${this.fieldName(f)}</span>
    </label>`;
  }

  protected override render() {
    const l = this.l;
    const id = this.uid;
    const c = this.hsva;
    const rgb = this.rgb;
    const hex = colorToHex(rgb, this.alpha);
    const solid = colorToHex({ ...rgb, a: 1 });
    const name = this.colourName(c);
    const prevHex = this.normal(this.previous ?? this.first) || hex;
    const prevRgb = parseColorHex(prevHex) ?? rgb;
    const swatches = this.swatchList;
    const current = swatches.findIndex((s) => colorToHex(this.alpha ? s.rgb : { ...s.rgb, a: 1 }, this.alpha) === hex);
    const canPick = this.eyedropper && !!eyeDropper();
    const fields: [Field, string][] =
      this.format === "hex"
        ? [["hex", l.formats.hex]]
        : this.format === "rgb"
          ? [
              ["r", "R"],
              ["g", "G"],
              ["b", "B"],
            ]
          : [
              ["c", "C"],
              ["m", "M"],
              ["y", "Y"],
              ["k", "K"],
            ];
    if (this.alpha) fields.push(["a", "%"]);
    const formats: SegmentOption[] = (["hex", "rgb", "cmyk"] as const).map((f) => ({ value: f, label: l.formats[f] }));
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: paletteIcon, title: this.heading || l.heading, subtitle: this.description, id: `${id}-title` })}
      <div class="ui-clp__card" role="group" aria-labelledby=${`${id}-title`}>
        ${this.slider("area", l.area, c.s, 100, `${l.saturation} ${Math.round(c.s)}%, ${l.brightness} ${Math.round(c.v)}%, ${name}`, {
          cls: "ui-clp__area",
          describedby: `${id}-keys`,
          style: `--hue: ${c.h}`,
          thumb: `left: ${c.s}%; top: ${100 - c.v}%; background: ${solid}`,
        })}
        <span class="tc-sr-only" id=${`${id}-keys`}>${l.areaKeys}</span>
        <div class="ui-clp__controls">
          ${canPick
            ? html`<button type="button" class="ui-clp__icon-btn ui-clp__eyedropper" title=${l.eyedropper} ?disabled=${this.locked} @click=${this.pick}>
                ${pipetteIcon}<span class="tc-sr-only">${l.eyedropper}</span>
              </button>`
            : nothing}
          <div class="ui-clp__preview">
            <button
              type="button"
              class="ui-clp__chip ui-clp__chip--previous"
              style=${`--chip: ${colorToHex(prevRgb, this.alpha)}`}
              title=${`${l.previous} ${prevHex}`}
              ?disabled=${this.locked}
              @click=${this.usePrevious}
            >
              <span class="tc-sr-only">${l.previous} ${prevHex}, ${l.usePrevious}</span>
            </button>
            <span class="ui-clp__chip ui-clp__chip--new" style=${`--chip: ${hex}`} role="img" aria-label=${`${l.newColor} ${hex}, ${name}`}></span>
          </div>
          <div class="ui-clp__tracks">
            ${this.slider("hue", l.hue, c.h, 360, `${l.degrees.replace("{n}", String(Math.round(c.h)))}, ${l.hueNames[[15, 45, 70, 165, 195, 255, 290, 340].findIndex((b) => c.h < b)] ?? l.hueNames[0]}`, {
              cls: "ui-clp__hue",
              thumb: `left: ${(c.h / 360) * 100}%; background: hsl(${c.h} 100% 50%)`,
            })}
            ${this.alpha
              ? this.slider("alpha", l.opacity, c.a * 100, 100, `${Math.round(c.a * 100)}%`, {
                  cls: "ui-clp__alpha",
                  style: `--solid: ${solid}`,
                  thumb: `left: ${c.a * 100}%; --chip: ${hex}`,
                })
              : nothing}
          </div>
        </div>
        <div class="ui-clp__values">
          <tc-segmented-control
            class="ui-clp__formats"
            look=${this.resolvedLook}
            size="sm"
            aria-label=${l.format}
            .options=${formats}
            .value=${this.format}
            ?disabled=${this.disabled}
            @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
              // The inner control's event stops here: the page hears tc-format-change
              e.stopPropagation();
              e.preventDefault();
              this.setFormat(e.detail.value as ColorPickerFormat);
            }}
          ></tc-segmented-control>
          <div class="ui-clp__fields" data-format=${this.format} @focusout=${(e: FocusEvent) => {
            // Commit when focus leaves the fields, not when it moves between them
            if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) this.commitFields();
          }}>
            ${fields.map(([f, short]) => this.field(f, short))}
            <button type="button" class="ui-clp__icon-btn ui-clp__copy" ?data-copied=${this.copied} title=${`${l.copy} ${this.text()}`} ?disabled=${this.disabled} @click=${this.copy}>
              ${this.copied ? checkIcon : copyIcon}<span class="tc-sr-only">${l.copy} ${this.text()}</span>
            </button>
          </div>
          ${this.error ? html`<p class="ui-clp__error" id=${`${id}-error`}>${this.error}</p>` : nothing}
        </div>
        ${swatches.length
          ? html`<div class="ui-clp__swatches" role="radiogroup" aria-label=${l.swatches}>
              ${swatches.map((s, i) => {
                const label = s.name ? `${s.name}, ${colorToHex(s.rgb, this.alpha && s.rgb.a < 1)}` : colorToHex(s.rgb, this.alpha && s.rgb.a < 1);
                return html`<button
                  type="button"
                  role="radio"
                  class="ui-clp__swatch"
                  aria-checked=${i === current ? "true" : "false"}
                  aria-label=${label}
                  title=${label}
                  tabindex=${i === (current < 0 ? 0 : current) && !this.disabled ? 0 : -1}
                  ?disabled=${this.disabled}
                  aria-disabled=${this.readonly ? "true" : "false"}
                  ?data-light=${isLight(s.rgb)}
                  style=${`--chip: ${colorToHex(s.rgb, true)}`}
                  @click=${() => this.pickSwatch(i)}
                  @keydown=${this.swatchKey(i)}
                >
                  ${i === current ? checkIcon : nothing}
                </button>`;
              })}
            </div>`
          : nothing}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="clp"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  max-width: var(--tc-clp-max-w);
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  color: var(--tc-text-muted);
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="clp"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  max-width: var(--tc-clp-max-w);
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  color: var(--tc-text-secondary);
}
[data-ui="clp"] {
  --tc-clp-max-w: 360px;
  --tc-clp-area-h: 176px;
  --tc-clp-thumb: 16px;
  --tc-clp-track-h: 12px;
  --tc-clp-chip: 40px;
  --tc-clp-check: 8px;
  --tc-clp-ring: 2px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="clp"] *, [data-ui="clp"] *::before, [data-ui="clp"] *::after { box-sizing: border-box; }
:where([data-ui="clp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="clp"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="clp"] p { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-clp__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-clp__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-clp__card { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
/* ----- Sliders ----- */
.ui-clp__slider { position: relative; touch-action: none; cursor: crosshair; outline: none; forced-color-adjust: none; }
.ui-clp__slider[aria-disabled="true"] { cursor: not-allowed; filter: grayscale(1); }
.ui-clp__area {
  height: var(--tc-clp-area-h);
  border-radius: var(--tc-radius-md);
  background: linear-gradient(to top, black, transparent), linear-gradient(to right, white, hsl(var(--hue, 0) 100% 50%));
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle);
}
.ui-clp__thumb {
  position: absolute;
  width: var(--tc-clp-thumb);
  height: var(--tc-clp-thumb);
  border: var(--tc-clp-ring) solid white;
  border-radius: 50%;
  box-shadow: 0 0 0 var(--tc-hairline) var(--tc-shadow-color-strong), var(--tc-shadow-control);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.ui-clp__slider:focus-visible .ui-clp__thumb { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-clp__tracks { display: grid; gap: var(--tc-space-3); min-width: 0; }
.ui-clp__hue, .ui-clp__alpha { height: var(--tc-clp-track-h); margin-inline: calc(var(--tc-clp-thumb) / 2); border-radius: var(--tc-radius-full); cursor: pointer; }
.ui-clp__hue .ui-clp__thumb, .ui-clp__alpha .ui-clp__thumb { top: 50%; }
.ui-clp__hue::before, .ui-clp__alpha::before {
  content: "";
  position: absolute;
  inset: 0 calc(var(--tc-clp-thumb) / -2);
  border-radius: inherit;
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle);
}
.ui-clp__hue::before { background: linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%)); }
.ui-clp__alpha::before {
  background:
    linear-gradient(to right, transparent, var(--solid)),
    repeating-conic-gradient(var(--tc-surface-sunken) 0 25%, var(--tc-surface-raised) 0 50%) 0 0 / calc(var(--tc-clp-check) * 2) calc(var(--tc-clp-check) * 2);
}
.ui-clp__alpha .ui-clp__thumb { background: linear-gradient(var(--chip), var(--chip)), repeating-conic-gradient(var(--tc-surface-sunken) 0 25%, var(--tc-surface-raised) 0 50%) 0 0 / var(--tc-clp-check) var(--tc-clp-check); }
/* ----- Eyedropper, the preview chip and the tracks in one row ----- */
.ui-clp__controls { display: flex; align-items: center; gap: var(--tc-space-3); }
.ui-clp__controls > .ui-clp__tracks { flex: 1; }
.ui-clp__icon-btn { flex: none; display: inline-grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-clp__icon-btn:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-clp__icon-btn:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-clp__copy[data-copied] { color: var(--tc-status-success-fg); }
.ui-clp__glyph, .ui-clp__check { width: var(--tc-space-4); height: var(--tc-space-4); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-clp__preview { flex: none; display: flex; width: var(--tc-clp-chip); height: var(--tc-clp-chip); overflow: hidden; border-radius: 50%; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); forced-color-adjust: none; }
.ui-clp__chip { flex: 1; display: block; background: linear-gradient(var(--chip), var(--chip)), repeating-conic-gradient(var(--tc-surface-sunken) 0 25%, var(--tc-surface-raised) 0 50%) 0 0 / var(--tc-clp-check) var(--tc-clp-check); }
.ui-clp__chip--previous:disabled { cursor: default; }
button.ui-clp__chip:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
/* ----- Format and fields ----- */
.ui-clp__values { display: grid; gap: var(--tc-space-2); }
.ui-clp__formats { justify-self: start; }
.ui-clp__fields { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--tc-space-2); }
.ui-clp__field { flex: 1 1 0; display: grid; gap: var(--tc-space-1); min-width: var(--tc-space-12); text-align: center; }
.ui-clp__field[data-field="hex"] { flex-grow: 3; min-width: var(--tc-space-16); }
.ui-clp__field-label { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-clp__input { width: 100%; min-width: 0; height: var(--tc-field-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; text-align: center; color: var(--tc-text-primary); outline: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-clp__input:hover:not(:disabled, :read-only) { box-shadow: var(--tc-field-shadow-hover); }
.ui-clp__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-clp__input[aria-invalid="true"]:not(:focus-visible) { box-shadow: var(--tc-field-shadow-invalid); }
.ui-clp__input:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-clp__copy { margin-top: 0; align-self: flex-start; }
.ui-clp__error { font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
/* ----- Swatches ----- */
.ui-clp__swatches { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); padding-top: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-clp__swatch {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  border-radius: var(--tc-radius-sm);
  background: linear-gradient(var(--chip), var(--chip)), repeating-conic-gradient(var(--tc-surface-sunken) 0 25%, var(--tc-surface-raised) 0 50%) 0 0 / var(--tc-clp-check) var(--tc-clp-check);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle);
  color: white;
  forced-color-adjust: none;
  transition: transform var(--tc-duration-quick) var(--tc-ease-standard);
}
.ui-clp__swatch[data-light] { color: black; }
.ui-clp__swatch[aria-checked="true"] { box-shadow: 0 0 0 var(--tc-clp-ring) var(--tc-surface-on-tray), 0 0 0 calc(var(--tc-clp-ring) * 2) var(--tc-border-selected); }
.ui-clp__swatch:hover:not(:disabled, [aria-disabled="true"]) { transform: scale(1.08); }
.ui-clp__swatch:disabled, .ui-clp__swatch[aria-disabled="true"] { cursor: not-allowed; }
.ui-clp__swatch .ui-clp__check { stroke-width: 3; }
@container (max-width: 300px) {
  .ui-clp__card { --tc-clp-area-h: 136px; padding: var(--tc-space-3); gap: var(--tc-space-3); }
  .ui-clp__field { flex-basis: calc(50% - var(--tc-space-2)); }
}
@media (forced-colors: active) {
  .ui-clp__thumb { border-color: CanvasText; }
  .ui-clp__swatch[aria-checked="true"] { outline: 2px solid Highlight; }
  .ui-clp__input[aria-invalid="true"] { outline: 2px solid Mark; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="clp"] *, [data-ui="clp"] *::before, [data-ui="clp"] *::after { animation: none; transition: none; }
}
`;
}

if (!customElements.get("tc-color-picker")) customElements.define("tc-color-picker", TcColorPicker);

declare global {
  interface HTMLElementTagNameMap {
    "tc-color-picker": TcColorPicker;
  }
}
