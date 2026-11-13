/*
 * <tc-edit-region> in real browsers: structure in both looks, brushing and erasing with pointer events, the coverage
 * line, undo / redo / clear from buttons and keys, the keyboard box, the cancelable change events, Generate with its
 * checks and the PNG mask, busy, a narrow width, the React wrapper (undo in controlled use) and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/edit-region";
import { measureMask, type EditRegionEdit, type EditRegionMaskChange, type EditRegionOp, type TcEditRegion } from "../../src/elements/edit-region";
import { EditRegion } from "../../src/elements/react/edit-region";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#eee"/><rect x="40" y="60" width="120" height="160" fill="#8cc5b6"/></svg>')}`;
const BOX: EditRegionOp = { kind: "box", x: 0.25, y: 0.25, w: 0.5, h: 0.5 };

const surface = (el: Element) => el.querySelector<HTMLElement>(".ui-edr__surface")!;
const status = (el: Element) => el.querySelector(".ui-edr__status")!.textContent!.trim();
const live = (el: Element) => el.querySelector('[role="status"]')!.textContent!.trim();
const btn = (el: Element, cls: string) => el.querySelector<HTMLButtonElement>(`.ui-edr__${cls}`)!;
const radio = (el: Element, tool: string) => el.querySelector<HTMLInputElement>(`.ui-edr__tool-input[value="${tool}"]`)!;
const make = (look: "standard" | "clean" = "standard", width = 520) =>
  fixture<HTMLElement>(html`<div style=${`width: ${width}px`}>
    <tc-edit-region look=${look} heading="Edit page 4" src=${SRC} alt="Report page with a chart"></tc-edit-region>
  </div>`).then(async (wrap) => {
    const el = wrap.querySelector("tc-edit-region")!;
    await expect.poll(() => el.querySelector<HTMLImageElement>(".ui-edr__img")!.complete).toBe(true);
    await settle();
    return el;
  });

/** Drags across the surface with pointer events, through the given fractions of its box */
async function drag(el: TcEditRegion, path: [number, number][], pointerType = "mouse", button = 0) {
  const s = surface(el);
  const r = s.getBoundingClientRect();
  const at = (i: number) => ({ clientX: r.left + path[i][0] * r.width, clientY: r.top + path[i][1] * r.height, pointerId: 3, pointerType, isPrimary: true, bubbles: true, cancelable: true, button, buttons: 1 });
  s.dispatchEvent(new PointerEvent("pointerdown", at(0)));
  for (let i = 1; i < path.length; i++) s.dispatchEvent(new PointerEvent("pointermove", at(i)));
  s.dispatchEvent(new PointerEvent("pointerup", { ...at(path.length - 1), buttons: 0 }));
  await settle();
}
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));

describe("tc-edit-region", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: header, tools as a radio group, the image, the status line and Generate`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("edr");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("h3")!.textContent).toBe("Edit page 4");
      expect(el.querySelector(".ui-edr__toolset legend")!.textContent).toBe("Tool");
      expect([...el.querySelectorAll(".ui-edr__tool")].map((t) => t.textContent!.trim())).toEqual(["Brush", "Erase", "Box"]);
      expect(radio(el, "brush").checked).toBe(true);
      expect(el.querySelector<HTMLImageElement>(".ui-edr__img")!.alt).toBe("Report page with a chart");
      expect(status(el)).toBe("Nothing selected yet");
      expect(btn(el, "undo").disabled).toBe(true);
      expect(btn(el, "clear").disabled).toBe(true);
      expect(btn(el, "generate").textContent!.trim()).toBe("Generate");
      expect(btn(el, "generate").getAttribute("aria-describedby")).toBe(el.querySelector(".ui-edr__status")!.id);
      expect(el.querySelector(".ui-edr__size-input")!.getAttribute("aria-valuetext")).toBe("32 px");
      // The stage keeps the image's own shape (400 × 300)
      await expect.poll(() => {
        const r = el.querySelector(".ui-edr__stage")!.getBoundingClientRect();
        return Math.round((r.width / r.height) * 100) / 100;
      }).toBe(1.33);
    });
  }

  test("measureMask: coverage and bounds of boxes, with erasures cut out", () => {
    const m = measureMask([BOX], 1);
    expect(m.coverage).toBeCloseTo(0.25, 2);
    expect(m.bounds).toEqual({ x: 0.25, y: 0.25, w: 0.5, h: 0.5 });
    const cut = measureMask([BOX, { kind: "box", x: 0.25, y: 0.25, w: 0.25, h: 0.5, erase: true }], 1);
    expect(cut.coverage).toBeCloseTo(0.125, 2);
    expect(cut.bounds!.x).toBeCloseTo(0.5, 2);
    expect(measureMask([], 1)).toEqual({ coverage: 0, bounds: null });
  });

  test("brushing adds a stroke in fractions of the image; erasing takes paint away; a right click doesn't draw", async () => {
    const el = (await make()) as TcEditRegion;
    const seen: EditRegionMaskChange[] = [];
    el.addEventListener("tc-mask-change", (e) => seen.push((e as CustomEvent<EditRegionMaskChange>).detail));
    await drag(el, [[0.2, 0.5], [0.4, 0.5], [0.6, 0.5], [0.8, 0.5]]);
    expect(seen).toHaveLength(1);
    expect(seen[0].reason).toBe("draw");
    const op = el.mask[0];
    expect(op.kind).toBe("brush");
    if (op.kind !== "brush") return;
    expect(op.points[0][0]).toBeCloseTo(0.2, 2);
    expect(op.points.at(-1)![0]).toBeCloseTo(0.8, 2);
    expect(op.size).toBeCloseTo(32 / surface(el).getBoundingClientRect().width, 3);
    expect(status(el)).toMatch(/^About \d+% of the image selected$/);
    const before = Number(/\d+/.exec(status(el))![0]);
    // Erase over half of it
    radio(el, "erase").click();
    await settle();
    expect(el.tool).toBe("erase");
    await drag(el, [[0.15, 0.5], [0.5, 0.5]], "pen");
    expect(el.mask[1]).toMatchObject({ kind: "brush", erase: true });
    expect(Number(/\d+/.exec(status(el))![0])).toBeLessThan(before);
    await drag(el, [[0.2, 0.2], [0.5, 0.2]], "mouse", 2);
    expect(el.mask).toHaveLength(2);
  });

  test("Undo, Redo and Clear from the buttons and Ctrl / ⌘ + Z, each announced", async () => {
    const el = (await make()) as TcEditRegion;
    el.mask = [BOX];
    await settle();
    expect(status(el)).toBe("About 25% of the image selected");
    await drag(el, [[0.1, 0.1], [0.2, 0.1]]);
    expect(el.mask).toHaveLength(2);
    btn(el, "undo").click();
    await settle();
    expect(el.mask).toEqual([BOX]);
    expect(live(el)).toBe("Undone");
    expect(btn(el, "redo").disabled).toBe(false);
    key(btn(el, "undo"), "z", { ctrlKey: true, metaKey: true, shiftKey: true });
    await settle();
    expect(el.mask).toHaveLength(2);
    expect(live(el)).toBe("Redone");
    key(btn(el, "redo"), "z", { ctrlKey: true, metaKey: true });
    await settle();
    expect(el.mask).toEqual([BOX]);
    btn(el, "clear").click();
    await settle();
    expect(el.mask).toEqual([]);
    expect(live(el)).toBe("Mask cleared");
    expect(status(el)).toBe("Nothing selected yet");
    // Clear can be undone too
    btn(el, "undo").click();
    await settle();
    expect(el.mask).toEqual([BOX]);
    // Ctrl + Z in the instruction field is the field's own
    const input = el.querySelector("textarea")!;
    key(input, "z", { ctrlKey: true, metaKey: true });
    await settle();
    expect(el.mask).toEqual([BOX]);
  });

  test("a prevented tc-mask-change keeps the mask; a prevented tc-tool-change keeps the tool", async () => {
    const el = (await make()) as TcEditRegion;
    el.addEventListener("tc-mask-change", (e) => e.preventDefault());
    el.addEventListener("tc-tool-change", (e) => e.preventDefault());
    await drag(el, [[0.2, 0.5], [0.8, 0.5]]);
    expect(el.mask).toEqual([]);
    radio(el, "box").click();
    await settle();
    expect(el.tool).toBe("brush");
    expect(radio(el, "brush").checked).toBe(true);
  });

  test("the box tool works from the keyboard: arrows move, Shift + arrows resize, Enter adds, Shift + Enter takes away", async () => {
    const el = (await make()) as TcEditRegion;
    const tools: string[] = [];
    el.addEventListener("tc-tool-change", (e) => tools.push((e as CustomEvent<{ tool: string }>).detail.tool));
    radio(el, "box").click();
    await settle();
    expect(tools).toEqual(["box"]);
    expect(el.querySelector(".ui-edr__size")).toBeNull();
    const box = el.querySelector<HTMLElement>(".ui-edr__draft")!;
    expect(box.tabIndex).toBe(0);
    expect(box.getAttribute("aria-roledescription")).toBe("Selection box");
    expect(box.getAttribute("aria-label")).toBe("Selection box: 30% from the left, 30% from the top, 40% wide, 40% tall");
    expect(el.querySelector(`#${box.getAttribute("aria-describedby")}`)!.textContent).toContain("Shift + arrow keys resize it");
    box.focus();
    key(box, "ArrowRight");
    key(box, "ArrowRight");
    await settle();
    key(el.querySelector(".ui-edr__draft")!, "ArrowDown", { shiftKey: true });
    await settle();
    expect(el.querySelector(".ui-edr__draft")!.getAttribute("aria-label")).toBe("Selection box: 34% from the left, 30% from the top, 40% wide, 42% tall");
    key(el.querySelector(".ui-edr__draft")!, "Enter");
    await settle();
    expect(el.mask).toEqual([{ kind: "box", x: 0.34, y: 0.3, w: 0.4, h: 0.42 }]);
    expect(live(el)).toBe("Box added to the mask");
    expect(status(el)).toBe("About 17% of the image selected");
    key(el.querySelector(".ui-edr__draft")!, "Enter", { shiftKey: true });
    await settle();
    expect(el.mask[1]).toMatchObject({ erase: true });
    expect(status(el)).toBe("Nothing selected yet");
    // The box can't leave the image
    for (let i = 0; i < 60; i++) key(el.querySelector(".ui-edr__draft")!, "ArrowLeft");
    await settle();
    expect(el.querySelector(".ui-edr__draft")!.getAttribute("aria-label")).toContain(": 0% from the left");
    // Add box does the same as Enter
    btn(el, "add").click();
    await settle();
    expect(el.mask).toHaveLength(3);
    // Dragging with the box tool draws a box
    await drag(el, [[0.6, 0.1], [0.7, 0.15], [0.8, 0.3]]);
    expect(el.mask[3]).toMatchObject({ kind: "box" });
    const b = el.mask[3] as Extract<EditRegionOp, { kind: "box" }>;
    expect(b.x).toBeCloseTo(0.6, 2);
    expect(b.w).toBeCloseTo(0.2, 2);
    expect(b.h).toBeCloseTo(0.2, 2);
  });

  test("Generate checks for a mask and an instruction, then sends the PNG mask, bounds and coverage and turns busy", async () => {
    const el = (await make()) as TcEditRegion;
    const sent: EditRegionEdit[] = [];
    el.addEventListener("tc-edit", (e) => sent.push((e as CustomEvent<EditRegionEdit>).detail));
    btn(el, "generate").click();
    await settle();
    expect(sent).toHaveLength(0);
    expect(el.querySelector(".ui-edr__hint")!.textContent).toBe("Mark part of the image first.");
    expect(live(el)).toBe("Mark part of the image first.");
    el.mask = [BOX];
    await settle();
    expect(el.querySelector(".ui-edr__hint")).toBeNull();
    btn(el, "generate").click();
    await settle();
    expect(sent).toHaveLength(0);
    expect(el.querySelector(".ui-edr__hint")!.textContent).toBe("Say what should change.");
    await expect.poll(() => document.activeElement).toBe(el.querySelector("textarea"));
    expect(el.querySelector("textarea")!.getAttribute("aria-invalid")).toBe("true");
    const instr: string[] = [];
    el.addEventListener("tc-instruction-change", (e) => instr.push((e as CustomEvent<{ instruction: string }>).detail.instruction));
    const ta = el.querySelector("textarea")!;
    ta.value = "Replace the chart with a table";
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(instr).toEqual(["Replace the chart with a table"]);
    // Ctrl / ⌘ + Enter in the field generates
    key(ta, "Enter", { ctrlKey: true, metaKey: true });
    await settle();
    expect(sent).toHaveLength(1);
    const d = sent[0];
    expect(d.instruction).toBe("Replace the chart with a table");
    expect(d.mask.startsWith("data:image/png;base64,")).toBe(true);
    // Measured on a small raster, so within a pixel of it
    const want = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 };
    for (const k of ["x", "y", "w", "h"] as const) expect(Math.abs(d.bounds[k] - want[k])).toBeLessThan(0.01);
    expect(d.coverage).toBeCloseTo(0.25, 2);
    expect(d.ops).toEqual([BOX]);
    // The mask is white where selected, black elsewhere, at the image's own size
    const img = new Image();
    img.src = d.mask;
    await img.decode();
    expect([img.naturalWidth, img.naturalHeight]).toEqual([400, 300]);
    const c = document.createElement("canvas");
    c.width = 400;
    c.height = 300;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    expect([...ctx.getImageData(200, 150, 1, 1).data].slice(0, 3)).toEqual([255, 255, 255]);
    expect([...ctx.getImageData(10, 10, 1, 1).data].slice(0, 3)).toEqual([0, 0, 0]);
    // Busy: everything held, Generate reads Generating…
    expect(el.busy).toBe(true);
    expect(el.querySelector(".ui-edr__card")!.getAttribute("aria-busy")).toBe("true");
    expect(btn(el, "generate").textContent!.trim()).toBe("Generating…");
    expect(btn(el, "undo").disabled).toBe(true);
    expect(el.querySelector("textarea")!.disabled).toBe(true);
    btn(el, "generate").click();
    await settle();
    expect(sent).toHaveLength(1);
    await drag(el, [[0.1, 0.1], [0.3, 0.1]]);
    expect(el.mask).toEqual([BOX]);
    // A prevented tc-edit leaves it idle
    el.busy = false;
    el.addEventListener("tc-edit", (e) => e.preventDefault());
    await settle();
    btn(el, "generate").click();
    await settle();
    expect(sent).toHaveLength(2);
    expect(el.busy).toBe(false);
  });

  test("a prevented tc-instruction-change puts the text back", async () => {
    const el = (await make()) as TcEditRegion;
    el.instruction = "Keep this";
    el.addEventListener("tc-instruction-change", (e) => e.preventDefault());
    await settle();
    const ta = el.querySelector("textarea")!;
    ta.value = "Something else";
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(ta.value).toBe("Keep this");
    expect(el.instruction).toBe("Keep this");
  });

  test("renamed labels, and a narrow width that keeps every button named", async () => {
    const wrap = await fixture(html`<div style="width: 340px"><tc-edit-region src=${SRC} alt="Page" .labels=${{ brush: "Paint", generate: "Make it so" }}></tc-edit-region></div>`);
    const el = wrap.querySelector("tc-edit-region")!;
    await settle();
    expect(el.querySelector(".ui-edr__tool")!.textContent!.trim()).toBe("Paint");
    expect(btn(el, "generate").textContent!.trim()).toBe("Make it so");
    // The tool and history words are hidden visually but still name their controls
    const word = el.querySelector(".ui-edr__undo span")!;
    expect(word.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(btn(el, "undo").textContent!.trim()).toBe("Undo");
    expect(el.querySelector(".ui-edr__stage")!.getBoundingClientRect().width).toBeLessThanOrEqual(340);
  });

  test("React: an uncontrolled mask survives re-renders; a controlled one waits for the parent, and undo follows it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    host.style.width = "520px";
    document.body.append(host);
    const root = createRoot(host);
    const seen: [EditRegionOp[], string][] = [];
    const render = (props: React.ComponentProps<typeof EditRegion>) => act(async () => root.render(React.createElement(EditRegion, props)));
    await render({ title: "Edit", src: SRC, alt: "Page", onMaskChange: (m, r) => void seen.push([m, r]) });
    await settle();
    const el = host.querySelector("tc-edit-region")!;
    expect(el.querySelector("h3")!.textContent).toBe("Edit");
    await act(async () => drag(el, [[0.2, 0.5], [0.6, 0.5]]));
    expect(seen).toHaveLength(1);
    expect(seen[0][1]).toBe("draw");
    await render({ title: "Edit again", src: SRC, alt: "Page", onMaskChange: (m, r) => void seen.push([m, r]) });
    await settle();
    expect(el.mask).toHaveLength(1);
    // Controlled: the parent applies each change
    let mask: EditRegionOp[] = [BOX];
    const controlled = () => render({ title: "Edit", src: SRC, alt: "Page", mask, onMaskChange: (m, r) => void (seen.push([m, r]), (mask = m)) });
    await controlled();
    await settle();
    expect(el.mask).toEqual([BOX]);
    btn(el, "clear").click();
    await settle();
    expect(seen.at(-1)![1]).toBe("clear");
    expect(el.mask).toEqual([BOX]);
    await controlled();
    await settle();
    expect(el.mask).toEqual([]);
    btn(el, "undo").click();
    await settle();
    expect(seen.at(-1)![1]).toBe("undo");
    await controlled();
    await settle();
    expect(el.mask).toEqual([BOX]);
    expect(btn(el, "redo").disabled).toBe(false);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, idle, with the box tool and busy`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); width: 560px">
        <tc-edit-region heading="Edit page 4" src=${SRC} alt="Report page" .mask=${[BOX]} instruction="Replace the chart"></tc-edit-region>
        <tc-edit-region look="clean" heading="Edit page 5" src=${SRC} alt="Report page" tool="box"></tc-edit-region>
        <tc-edit-region look="clean" heading="Edit page 6" src=${SRC} alt="Report page" .mask=${[BOX]} busy></tc-edit-region>
      </div>`);
      await settle();
      wrap.querySelectorAll("tc-edit-region")[0].querySelector<HTMLButtonElement>(".ui-edr__generate")!.click();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
