/*
 * <tc-signature-pad> in real browsers: the pad's name and state, drawing with pointer events, undo and clear, the
 * cancelable tc-value-change, typed mode from the keyboard, readonly / disabled / invalid, the form, export, the
 * stroke outline, a narrow width, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/signature-pad";
import { strokePath, type SignatureValue, type SignatureValueChange, type TcSignaturePad } from "../../src/elements/signature-pad";
import { SignaturePad } from "../../src/elements/react/signature-pad";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DATE = Date.UTC(2026, 10, 10, 12);
const STORED: SignatureValue = {
  kind: "drawn",
  strokes: [
    { points: [[0.1, 0.5, 0, 0.5], [0.3, 0.4, 40, 0.5], [0.5, 0.55, 80, 0.5]] },
    { points: [[0.55, 0.5, 0, 0.5], [0.8, 0.45, 60, 0.5]] },
  ],
};

const pad = (el: Element) => el.querySelector<HTMLElement>(".ui-sigp__surface")!;
const btn = (el: Element, cls: string) => el.querySelector<HTMLButtonElement>(`.ui-sigp__${cls}`)!;
const strokes = (el: Element) => el.querySelectorAll(".ui-sigp__stroke").length;
const make = (look: "standard" | "clean" = "standard", extra = html``) =>
  fixture<TcSignaturePad>(html`<div style="width: 480px">
    <tc-signature-pad look=${look} heading="Data-access agreement" signer="Noor Haddad" .date=${DATE} locale="en-GB" statement="By signing you accept section 4."></tc-signature-pad>${extra}
  </div>`).then((wrap) => wrap.querySelector("tc-signature-pad")!);

/** Draws one stroke across the pad with pointer events, through the given fractions of its box */
async function draw(el: TcSignaturePad, path: [number, number][], pointerType = "mouse") {
  const s = pad(el);
  const r = s.getBoundingClientRect();
  const at = (i: number) => ({ clientX: r.left + path[i][0] * r.width, clientY: r.top + path[i][1] * r.height, pointerId: 7, pointerType, isPrimary: true, bubbles: true, cancelable: true, button: 0, buttons: 1, pressure: pointerType === "pen" ? 0.9 : 0.5 });
  s.dispatchEvent(new PointerEvent("pointerdown", at(0)));
  for (let i = 1; i < path.length; i++) s.dispatchEvent(new PointerEvent("pointermove", at(i)));
  s.dispatchEvent(new PointerEvent("pointerup", { ...at(path.length - 1), buttons: 0 }));
  await settle();
}
const LINE: [number, number][] = [[0.1, 0.5], [0.2, 0.45], [0.35, 0.55], [0.5, 0.5]];

describe("tc-signature-pad", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the pad is an image named by the heading and its state; signer, date and statement below`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("sigp");
      expect(el.dataset.look).toBe(look);
      expect(pad(el).getAttribute("role")).toBe("img");
      expect(pad(el).getAttribute("aria-label")).toBe("Data-access agreement: Not signed yet");
      expect(el.querySelector(".ui-sigp__placeholder")!.textContent).toBe("Sign here");
      expect(el.querySelector("h3")!.textContent).toBe("Data-access agreement");
      expect(el.querySelector(".ui-sigp__signer")!.textContent).toBe("Noor Haddad");
      expect(el.querySelector(".ui-sigp__date")!.textContent).toContain("10 Nov 2026");
      expect(pad(el).getAttribute("aria-describedby")).toBe(el.querySelector(".ui-sigp__statement")!.id);
      expect(el.querySelector('[role="toolbar"]')!.getAttribute("aria-labelledby")).toBe(el.querySelector("h3")!.id);
      expect([...el.querySelectorAll(".ui-sigp__tools button")].map((b) => b.textContent!.trim())).toEqual(["Undo", "Clear", "Type instead"]);
      expect(btn(el, "undo").disabled).toBe(true);
      expect(btn(el, "clear").disabled).toBe(true);
    });
  }

  test("drawing: a stroke per pointer drag, normalised to the pad, with timing; the value event fires on stroke end", async () => {
    const el = await make();
    const seen: SignatureValueChange[] = [];
    el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<SignatureValueChange>).detail));
    await draw(el, LINE);
    expect(seen).toHaveLength(1);
    const v = el.value!;
    expect(v.kind).toBe("drawn");
    expect(v.strokes).toHaveLength(1);
    const pts = v.strokes![0].points;
    expect(pts[0][0]).toBeCloseTo(0.1, 2);
    expect(pts[0][1]).toBeCloseTo(0.5, 2);
    expect(pts.at(-1)![0]).toBeCloseTo(0.5, 2);
    expect(pts.every((p) => p[2] >= 0 && p[3] === 0.5)).toBe(true);
    expect(strokes(el)).toBe(1);
    expect(pad(el).getAttribute("aria-label")).toBe("Data-access agreement: Signed");
    expect(el.querySelector(".ui-sigp__placeholder")).toBeNull();
    expect(el.hasAttribute("data-signed")).toBe(true);
    await draw(el, [[0.6, 0.4], [0.8, 0.6]], "pen");
    expect(el.value!.strokes).toHaveLength(2);
    expect(el.value!.strokes![1].points[0][3]).toBeCloseTo(0.9, 2);
    expect(strokes(el)).toBe(2);
    // A right click doesn't draw
    pad(el).dispatchEvent(new PointerEvent("pointerdown", { pointerId: 8, pointerType: "mouse", button: 2, bubbles: true }));
    pad(el).dispatchEvent(new PointerEvent("pointerup", { pointerId: 8, pointerType: "mouse", button: 2, bubbles: true }));
    await settle();
    expect(el.value!.strokes).toHaveLength(2);
  });

  test("Undo removes the last stroke, Clear empties the pad; each is announced and fires the value event", async () => {
    const el = await make();
    el.value = STORED;
    await settle();
    expect(strokes(el)).toBe(2);
    const seen: (SignatureValue | null)[] = [];
    el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<SignatureValueChange>).detail.value));
    btn(el, "undo").click();
    await settle();
    expect(strokes(el)).toBe(1);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Last stroke removed");
    btn(el, "clear").click();
    await settle();
    expect(el.value).toBeNull();
    expect(strokes(el)).toBe(0);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Signature cleared");
    expect(seen.map((v) => v?.strokes?.length ?? null)).toEqual([1, null]);
    // Undo of the only stroke empties it
    await draw(el, LINE);
    btn(el, "undo").click();
    await settle();
    expect(el.value).toBeNull();
  });

  test("tc-value-change is cancelable: prevented, the stroke, undo and clear leave the value as it was", async () => {
    const el = await make();
    el.value = STORED;
    await settle();
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    await draw(el, LINE);
    expect(el.value).toBe(STORED);
    expect(strokes(el)).toBe(2);
    expect(el.querySelector<SVGPathElement>(".ui-sigp__live")!.hasAttribute("d")).toBe(false);
    btn(el, "undo").click();
    btn(el, "clear").click();
    await settle();
    expect(el.value).toBe(STORED);
  });

  test("typed mode by keyboard: the toggle is in the tab order even without allow-typed; typing sets a typed value", async () => {
    const el = await make();
    const mode = btn(el, "mode");
    expect(mode.hasAttribute("data-quiet")).toBe(true);
    expect(mode.getAttribute("aria-pressed")).toBe("false");
    // Hidden from pointer users until focused, but still a focusable button
    expect(mode.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    mode.focus();
    expect(document.activeElement).toBe(mode);
    mode.click();
    await expect.poll(() => document.activeElement?.classList.contains("ui-sigp__typed-input")).toBe(true);
    expect(pad(el).hidden).toBe(true);
    const input = document.activeElement as HTMLInputElement;
    expect(input.labels?.[0]?.textContent).toContain("Type your full name");
    expect(input.placeholder).toBe("Noor Haddad");
    const seen: (SignatureValue | null)[] = [];
    el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<SignatureValueChange>).detail.value));
    input.value = "Noor Haddad";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.value).toEqual({ kind: "typed", text: "Noor Haddad" });
    expect(seen.at(-1)).toEqual({ kind: "typed", text: "Noor Haddad" });
    expect(el.querySelector(".ui-sigp__script")!.textContent).toBe("Noor Haddad");
    expect(btn(el, "undo").disabled).toBe(true);
    expect(btn(el, "mode").textContent!.trim()).toBe("Draw instead");
    expect(btn(el, "mode").getAttribute("aria-pressed")).toBe("true");
    // Back to the pad: the typed signature shows on it until something is drawn
    btn(el, "mode").click();
    await expect.poll(() => document.activeElement).toBe(btn(el, "mode"));
    expect(pad(el).getAttribute("aria-label")).toBe("Data-access agreement: Signed: Noor Haddad");
    await draw(el, LINE);
    expect(el.value!.kind).toBe("drawn");
    // Emptying the name empties the value; a prevented change puts the text back
    el.value = { kind: "typed", text: "N. Haddad" };
    await settle();
    const field = el.querySelector<HTMLInputElement>(".ui-sigp__typed-input")!;
    expect(field.value).toBe("N. Haddad");
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-value-change", stop);
    field.value = "Nobody";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(field.value).toBe("N. Haddad");
    el.removeEventListener("tc-value-change", stop);
    field.value = "  ";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.value).toBeNull();
  });

  test("allow-typed shows the toggle; readonly shows the signature with no tools; disabled blocks drawing", async () => {
    const el = await make();
    el.allowTyped = true;
    await settle();
    expect(btn(el, "mode").hasAttribute("data-quiet")).toBe(false);
    expect(btn(el, "mode").getBoundingClientRect().width).toBeGreaterThan(20);
    el.value = STORED;
    el.readonly = true;
    await settle();
    expect(el.querySelector(".ui-sigp__tools")).toBeNull();
    expect(strokes(el)).toBe(2);
    await draw(el, LINE);
    expect(el.value).toBe(STORED);
    el.readonly = false;
    el.disabled = true;
    await settle();
    expect(btn(el, "clear").disabled).toBe(true);
    expect(el.querySelector(".ui-sigp__mode")).toBeNull();
    await draw(el, LINE);
    expect(el.value).toBe(STORED);
  });

  test("invalid shows the error and describes the pad; renamed labels", async () => {
    const el = await make();
    el.invalid = true;
    el.errorMessage = "Sign the agreement to continue.";
    el.labels = { placeholder: "Firma aquí", clear: "Borrar" };
    await settle();
    const err = el.querySelector(".ui-sigp__error")!;
    expect(err.textContent).toBe("Sign the agreement to continue.");
    expect(pad(el).getAttribute("aria-describedby")!.split(" ")).toContain(err.id);
    expect(el.querySelector(".ui-sigp__placeholder")!.textContent).toBe("Firma aquí");
    expect(btn(el, "clear").textContent).toBe("Borrar");
  });

  test("form: submits JSON under name, required blocks an empty submit, reset clears, a disabled fieldset disables", async () => {
    const wrap = await fixture(html`<form><fieldset><tc-signature-pad name="signature" required></tc-signature-pad></fieldset></form>`);
    const form = wrap as HTMLFormElement;
    const el = form.querySelector("tc-signature-pad")!;
    expect(form.checkValidity()).toBe(false);
    expect(new FormData(form).get("signature")).toBeNull();
    el.value = STORED;
    await settle();
    expect(form.checkValidity()).toBe(true);
    expect(JSON.parse(new FormData(form).get("signature") as string)).toEqual(STORED);
    form.reset();
    await settle();
    expect(el.value).toBeNull();
    el.value = STORED;
    form.querySelector("fieldset")!.disabled = true;
    await settle();
    expect(new FormData(form).get("signature")).toBeNull();
    expect(btn(el, "clear").disabled).toBe(true);
  });

  test("export: toSVG and toDataURL for drawn and typed signatures, null when unsigned", async () => {
    const el = await make();
    expect(el.toSVG()).toBeNull();
    expect(el.toDataURL()).toBeNull();
    el.value = STORED;
    await settle();
    const svg = el.toSVG()!;
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.documentElement.localName).toBe("svg");
    expect(doc.querySelectorAll("path")).toHaveLength(2);
    expect(doc.querySelector("g")!.getAttribute("fill")).toMatch(/^rgb/);
    expect(el.toDataURL()).toMatch(/^data:image\/png;base64,/);
    expect(el.toDataURL("image/jpeg", 0.8)).toMatch(/^data:image\/jpeg/);
    el.value = { kind: "typed", text: "Noor <Haddad>" };
    await settle();
    const typed = new DOMParser().parseFromString(el.toSVG()!, "image/svg+xml");
    expect(typed.querySelector("text")!.textContent).toBe("Noor <Haddad>");
    expect(el.toDataURL()).toMatch(/^data:image\/png/);
  });

  test("strokePath: a closed outline wider than the stroke's ends, a dot for a single point", () => {
    const host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    host.setAttribute("viewBox", "0 0 300 100");
    host.style.width = "300px";
    document.body.append(host);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    host.append(path);
    path.setAttribute("d", strokePath([[0.2, 0.5, 0, 0.5], [0.5, 0.5, 50, 0.5], [0.8, 0.5, 100, 0.5]], 300, 100));
    const b = path.getBBox();
    expect(path.getAttribute("d")!.endsWith("Z")).toBe(true);
    expect(b.x).toBeLessThan(60);
    expect(b.x + b.width).toBeGreaterThan(240);
    expect(b.height).toBeGreaterThan(1);
    path.setAttribute("d", strokePath([[0.5, 0.5, 0, 0.5]], 300, 100));
    expect(path.getBBox().width).toBeGreaterThan(1);
    host.remove();
  });

  test("narrow: the pad keeps its minimum height and fills the width", async () => {
    const wrap = await fixture(html`<div style="width: 260px"><tc-signature-pad></tc-signature-pad></div>`);
    const el = wrap.querySelector("tc-signature-pad")!;
    const r = pad(el).getBoundingClientRect();
    expect(r.height).toBeGreaterThanOrEqual(119);
    expect(r.width).toBeGreaterThan(200);
    await expect.poll(() => el.querySelector(".ui-sigp__svg")!.getAttribute("viewBox")).toBe(`0 0 ${Math.round(r.width)} ${Math.round(r.height)}`);
  });

  test("React: uncontrolled keeps its strokes across re-renders; controlled stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    host.style.width = "480px";
    document.body.append(host);
    const root = createRoot(host);
    const seen: (SignatureValue | null)[] = [];
    const render = (props: React.ComponentProps<typeof SignaturePad>) => act(async () => root.render(React.createElement(SignaturePad, props)));
    await render({ title: "Agreement", signer: "A", onValueChange: (v) => void seen.push(v) });
    await settle();
    const el = host.querySelector("tc-signature-pad")!;
    expect(el.querySelector("h3")!.textContent).toBe("Agreement");
    await act(async () => draw(el, LINE));
    expect(seen).toHaveLength(1);
    await render({ title: "Agreement", signer: "B", onValueChange: (v) => void seen.push(v) });
    await settle();
    expect(strokes(el)).toBe(1);
    // Controlled: the change is reported, the value waits for the parent
    await render({ title: "Agreement", value: STORED, onValueChange: (v) => void seen.push(v) });
    await settle();
    expect(strokes(el)).toBe(2);
    btn(el, "clear").click();
    await settle();
    expect(seen.at(-1)).toBeNull();
    expect(strokes(el)).toBe(2);
    await render({ title: "Agreement", value: null, onValueChange: (v) => void seen.push(v) });
    await settle();
    expect(strokes(el)).toBe(0);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); width: 520px">
        <tc-signature-pad heading="Data-access agreement" signer="Noor Haddad" .date=${DATE} statement="By signing you accept section 4." .value=${STORED} allow-typed></tc-signature-pad>
        <tc-signature-pad look="clean" heading="Witness" required invalid></tc-signature-pad>
        <tc-signature-pad look="clean" heading="Supervisor" .value=${{ kind: "typed", text: "Tomás Ferreira" }}></tc-signature-pad>
        <tc-signature-pad heading="Data steward" readonly .value=${STORED}></tc-signature-pad>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
