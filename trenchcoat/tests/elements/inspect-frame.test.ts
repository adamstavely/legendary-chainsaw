/*
 * <tc-inspect-frame> in real browsers: the content and the overlay share one cell, rows are measured from the live
 * content (or `targets`), the walk advances and rests after `rounds`, reduced motion and playing=false hold still,
 * decorative vs named, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import { TcInspectFrame } from "../../src/elements/inspect-frame";
import { InspectFrame } from "../../src/elements/react/inspect-frame";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

// A small card: three rows with known padding
const card = html`<div class="card" style="display: block; padding: 8px; background: Canvas; color: CanvasText">
  <div class="row r1" style="padding: 10px 12px">Survey writer</div>
  <div class="row r2" style="padding: 6px 12px; width: 120px; box-sizing: border-box">Draft the methods section</div>
  <div class="row r3" style="padding: 4px 12px 8px">Done · 3 steps</div>
</div>`;

const frame = (attrs: { hold?: number; delay?: number; rounds?: number; targets?: string; playing?: boolean; label?: string } = {}) =>
  fixture<TcInspectFrame>(html`<tc-inspect-frame
    style="width: 400px"
    .hold=${attrs.hold ?? 1600}
    .delay=${attrs.delay ?? 600}
    .rounds=${attrs.rounds ?? 2}
    .targets=${attrs.targets ?? ""}
    .playing=${attrs.playing ?? true}
    .label=${attrs.label ?? ""}
  >${card}</tc-inspect-frame>`);

describe("tc-inspect-frame", () => {
  test("keeps the content, adds one overlay layer, and is an inert picture", async () => {
    const el = await frame();
    expect(el.dataset.ui).toBe("isp");
    expect(el.querySelector(":scope > .card")).not.toBeNull();
    expect(el.querySelectorAll(":scope > .ui-isp-layer")).toHaveLength(1);
    expect(el.inert).toBe(true);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.hasAttribute("role")).toBe(false);
    expect(TcInspectFrame.css).not.toMatch(/\binfinite\b/);
  });

  test("measures the root's block children, and the first frame sits over the first row", async () => {
    const el = await frame({ delay: 0, hold: 2000 });
    await expect.poll(() => el.measuredRows.length).toBe(3);
    const [r1, r2] = el.measuredRows;
    expect(r1.x).toBeCloseTo(8, 0);
    expect(r1.y).toBeCloseTo(8, 0);
    expect(r1.pad).toEqual([10, 12, 10, 12]);
    expect(r1.sizing).toBe("Fill");
    expect(r2.sizing).toBe("Hug");
    expect(Math.round(r2.w)).toBe(120);
    await expect.poll(() => el.querySelector(".ui-isp-layer")?.getAttribute("data-phase")).toBe("show");
    const layer = el.querySelector<HTMLElement>(".ui-isp-layer")!;
    expect(layer.style.getPropertyValue("--y")).toBe(`${r1.y}px`);
    expect(el.querySelector(".ui-isp-chip")!.textContent).toBe(`W Fill ${Math.round(r1.w)}px`);
    // One guide per non-zero padding, with its number
    expect([...el.querySelectorAll(".ui-isp-num")].map((n) => n.textContent)).toEqual(["10", "12", "10", "12"]);
  });

  test("the measurements are the content's own pixels, whatever the tilt and scale", async () => {
    const el = await frame({ playing: false });
    await expect.poll(() => el.measuredRows.length).toBe(3);
    const content = el.querySelector<HTMLElement>(".card")!;
    expect(getComputedStyle(content).transform).not.toBe("none");
    expect(Math.round(el.measuredRows[0].w)).toBe(content.offsetWidth - 16);
  });

  test("targets picks the rows", async () => {
    const el = await frame({ targets: ".r2, .r3", playing: false });
    await expect.poll(() => el.measuredRows.length).toBe(2);
    expect(Math.round(el.measuredRows[0].w)).toBe(120);
    el.targets = "[not a selector";
    await settle();
    expect(el.measuredRows).toHaveLength(0);
  });

  test("walks through the rows, then rests on the first after `rounds`", async () => {
    const el = await frame({ delay: 0, hold: 500, rounds: 1 });
    const seen = new Set<number>();
    await expect
      .poll(() => {
        seen.add(el.selectedIndex);
        return seen.size;
      }, { timeout: 6000, interval: 50 })
      .toBe(3);
    await expect.poll(() => el.hasAttribute("data-done"), { timeout: 6000 }).toBe(true);
    expect(el.selectedIndex).toBe(0);
    expect(el.querySelector(".ui-isp-layer")!.getAttribute("data-phase")).toBe("show");
  });

  test("playing=false holds on the first row", async () => {
    const el = await frame({ delay: 0, hold: 450, playing: false });
    await expect.poll(() => el.hasAttribute("data-done")).toBe(true);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 700)));
    expect(el.selectedIndex).toBe(0);
    expect(el.querySelector(".ui-isp-layer")!.getAttribute("data-phase")).toBe("show");
  });

  test("reduced motion: the selection stands still on the first row", async () => {
    const real = window.matchMedia.bind(window);
    vi.stubGlobal("matchMedia", (q: string) => (q.includes("reduced-motion") ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : real(q)));
    const el = await frame({ delay: 0, hold: 450 });
    await expect.poll(() => el.hasAttribute("data-done")).toBe(true);
    await new Promise((r) => setTimeout(r, 700));
    expect(el.selectedIndex).toBe(0);
    expect(el.querySelector(".ui-isp-layer")!.getAttribute("data-phase")).toBe("show");
  });

  test("a label names it as an image", async () => {
    const el = await frame({ label: "A card with its header selected" });
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("A card with its header selected");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
    el.label = "";
    await settle();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("mirror and flat change the tilt", async () => {
    const el = await frame({ playing: false });
    const content = el.querySelector<HTMLElement>(".card")!;
    const tilted = getComputedStyle(content).transform;
    el.mirror = true;
    await settle();
    expect(getComputedStyle(content).transform).not.toBe(tilted);
    el.flat = true;
    await settle();
    // Flat: only the scale is left – a 2D matrix
    expect(getComputedStyle(content).transform).toMatch(/^matrix\(/);
  });

  test("React wrapper: children become the content, props reach the host, the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "400px";
    const root = createRoot(host);
    const ref = React.createRef<TcInspectFrame>();
    await act(async () =>
      root.render(
        React.createElement(
          InspectFrame,
          { className: "mine", mirror: true, playing: false, label: "Picture", ref },
          React.createElement("p", { style: { padding: 6 } }, "One"),
          React.createElement("p", { style: { padding: 6 } }, "Two"),
        ),
      ),
    );
    await settle();
    const el = host.querySelector<TcInspectFrame>("tc-inspect-frame")!;
    expect(ref.current).toBe(el);
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.mirror).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Picture");
    expect(el.querySelector(":scope > .ui-isp-content")).not.toBeNull();
    await expect.poll(() => el.measuredRows.length).toBe(2);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, decorative and named, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      for (const label of ["", "A card with its header selected"]) {
        const wrap = await fixture(html`<div style=${`background: Canvas; color: CanvasText; color-scheme: ${scheme}; width: 400px`}>
          <tc-inspect-frame .playing=${false} .label=${label}>${card}</tc-inspect-frame>
        </div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => v.id)).toEqual([]);
        cleanup();
      }
    }
  });
});
