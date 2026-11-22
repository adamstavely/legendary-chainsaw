/*
 * <tc-tray-status> in real browsers: each status's scene, colour and words, a caption of the page's own, its name and
 * decorative mode, pausing off screen, finite motion, dark colours, the React wrapper and axe for every status in both
 * themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcTrayStatus, trayStatusWords, type TrayStatusKind } from "../../src/elements/tray-status";
import { TrayStatus } from "../../src/elements/react/tray-status";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const STATUSES: TrayStatusKind[] = ["all-done", "upload-failed", "empty", "import-complete", "export-ready", "storage-full", "drop-to-upload", "new-items", "paused", "sync-complete", "importing", "import-errors", "no-matches"];

describe("tc-tray-status", () => {
  test("each status draws its own scene, colour and words", async () => {
    const el = await fixture<TcTrayStatus>(html`<tc-tray-status></tc-tray-status>`);
    expect(el.dataset.ui).toBe("trs");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
    const fills = new Set<string>();
    for (const status of STATUSES) {
      el.status = status;
      await settle();
      expect(el.getAttribute("status")).toBe(status);
      const words = trayStatusWords[status].replace("{n}", "3");
      expect(el.querySelector(".ui-trs-caption")!.textContent).toBe(words);
      expect(el.getAttribute("role")).toBe("img");
      expect(el.getAttribute("aria-label")).toBe(words);
      expect(el.querySelector(".ui-trs-check") !== null).toBe(status === "all-done" || status === "import-complete" || status === "sync-complete");
      expect(el.querySelector(".ui-trs-count") !== null).toBe(status === "new-items");
      expect(el.querySelector(".ui-trs-bars") !== null).toBe(status === "paused");
      expect(el.querySelector(".ui-trs-spin") !== null).toBe(status === "sync-complete");
      expect(el.querySelector(".ui-trs-file") !== null).toBe(status === "upload-failed" || status === "export-ready");
      expect(el.querySelector(".ui-trs-pages") !== null).toBe(status === "import-complete" || status === "import-errors");
      expect(el.querySelectorAll(".ui-trs-fall").length).toBe(status === "importing" ? 2 : 0);
      expect(el.querySelector(".ui-trs-ring") !== null).toBe(status === "importing");
      expect(el.querySelector(".ui-trs-spill") !== null).toBe(status === "storage-full");
      expect(el.querySelector(".ui-trs-outline") !== null).toBe(status === "drop-to-upload");
      // Every scene but the empty tray has a badge
      const badge = el.querySelector(".ui-trs-badge");
      expect(badge !== null).toBe(status !== "empty");
      if (badge) fills.add(getComputedStyle(badge).fill);
    }
    // Green, red, blue, amber and slate badges
    expect(fills.size).toBe(5);
  });

  test("a caption of its own wins; label says more; with no words it's decorative", async () => {
    const el = await fixture<TcTrayStatus>(html`<tc-tray-status status="upload-failed" caption="Scan too large"></tc-tray-status>`);
    expect(el.getAttribute("aria-label")).toBe("Scan too large");
    el.label = "The scan is over the 25 MB limit";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("The scan is over the 25 MB limit");
    el.label = "";
    el.caption = "";
    await settle();
    expect(el.querySelector(".ui-trs-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    el.caption = undefined;
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Upload failed");
  });

  test("off screen the motion holds, and runs on when it's back; every status's motion is finite", async () => {
    expect(TcTrayStatus.css).not.toMatch(/\binfinite\b/);
    const el = await fixture<TcTrayStatus>(html`<tc-tray-status status="upload-failed" style="position: absolute; top: 5000px; width: 200px"></tc-tray-status>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-trs-file")!).animationPlayState).toBe("paused");
    expect(getComputedStyle(el.querySelector(".ui-trs-file")!).animationIterationCount).toBe("3");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
    el.status = "all-done";
    await settle();
    expect(getComputedStyle(el.querySelector(".ui-trs-mark")!).animationIterationCount).toBe("3");
    // Each scene's own motion runs, a set number of times
    for (const [status, cls, n] of [["empty", "mark", "3"], ["import-complete", "pages", "1"], ["export-ready", "file", "3"], ["storage-full", "spill", "3"], ["drop-to-upload", "hover", "3"], ["new-items", "mark", "3"], ["paused", "mark", "2"], ["sync-complete", "spin", "1"], ["importing", "ring", "3"], ["importing", "fall", "3"], ["import-errors", "pages", "1"], ["no-matches", "mark", "3"]] as const) {
      el.status = status;
      await settle();
      const cs = getComputedStyle(el.querySelector(`.ui-trs-${cls}`)!);
      expect(cs.animationName).not.toBe("none");
      expect(cs.animationIterationCount).toBe(n);
    }
  });

  test("all-done and upload-failed keep the scenes of the elements they replace", async () => {
    const el = await fixture<TcTrayStatus>(html`<tc-tray-status></tc-tray-status>`);
    // All Done: the tray at 86, 92, 148 × 64, its rim, and a 28 px badge with a check that draws itself once
    expect(el.querySelector(".ui-trs-tray")!.getAttribute("width")).toBe("148");
    expect(el.querySelector(".ui-trs-rim")!.getAttribute("d")).toBe("M104 116h24l8 12h48l8-12h24");
    expect(el.querySelector(".ui-trs-badge")!.getAttribute("r")).toBe("28");
    expect(getComputedStyle(el.querySelector(".ui-trs-check")!).animationIterationCount).toBe("1");
    expect(getComputedStyle(el.querySelector(".ui-trs-badge")!).fill).toBe("rgb(220, 243, 228)");
    el.status = "upload-failed";
    await settle();
    // Upload Failed: the file at 124, 24 above the tray, its arrow stopping short, a 19 px cross badge in red
    expect(el.querySelector(".ui-trs-file .ui-trs-wire")!.getAttribute("d")).toBe("M160 100V72M149 82l11-11 11 11");
    expect(el.querySelector(".ui-trs-badge")!.getAttribute("r")).toBe("19");
    expect(getComputedStyle(el.querySelector(".ui-trs-badge")!).fill).toBe("rgb(253, 226, 223)");
  });

  test("new-items shows its count in the badge and the words, 99+ past 99, and a caption still wins", async () => {
    const el = await fixture<TcTrayStatus>(html`<tc-tray-status status="new-items" count="12"></tc-tray-status>`);
    expect(el.querySelector(".ui-trs-count")!.textContent).toBe("12");
    expect(el.getAttribute("aria-label")).toBe("12 new");
    el.count = 240;
    await settle();
    expect(el.querySelector(".ui-trs-count")!.textContent).toBe("99+");
    expect(el.querySelector(".ui-trs-caption")!.textContent).toBe("99+ new");
    el.caption = "New cases";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("New cases");
    expect(el.querySelector(".ui-trs-count")!.textContent).toBe("99+");
  });

  test("dark follows color-scheme", async () => {
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-tray-status></tc-tray-status></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-trs-tray")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcTrayStatus>();
    await act(async () => root.render(React.createElement(TrayStatus, { className: "mine", status: "upload-failed", ref })));
    await settle();
    const el = host.querySelector<TcTrayStatus>("tc-tray-status")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Upload failed");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations for every status, in both themes", async () => {
    for (const scheme of ["light", "dark"])
      for (const status of STATUSES) {
        const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-tray-status status=${status}></tc-tray-status></div>`);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => v.id)).toEqual([]);
      }
  });
});
