/*
 * <tc-folder-status> in real browsers: each status's scene, colour and words, a caption of the page's own, its name and
 * decorative mode, pausing off screen, finite motion, dark colours, the React wrapper and axe for every status in both
 * themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { folderStatusWords, TcFolderStatus, type FolderStatusKind } from "../../src/elements/folder-status";
import { FolderStatus } from "../../src/elements/react/folder-status";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const STATUSES: FolderStatusKind[] = ["empty", "shared", "archived", "locked"];

describe("tc-folder-status", () => {
  test("each status draws its own scene, colour and words", async () => {
    const el = await fixture<TcFolderStatus>(html`<tc-folder-status></tc-folder-status>`);
    expect(el.dataset.ui).toBe("fds");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
    const fills = new Set<string>();
    for (const status of STATUSES) {
      el.status = status;
      await settle();
      expect(el.getAttribute("status")).toBe(status);
      expect(el.querySelector(".ui-fds-caption")!.textContent).toBe(folderStatusWords[status]);
      expect(el.getAttribute("role")).toBe("img");
      expect(el.getAttribute("aria-label")).toBe(folderStatusWords[status]);
      expect(el.querySelector(".ui-fds-back")).not.toBeNull();
      expect(el.querySelector(".ui-fds-flap") !== null).toBe(status === "empty");
      expect(el.querySelector(".ui-fds-arrow") !== null).toBe(status === "archived");
      const badge = el.querySelector(".ui-fds-badge");
      expect(badge !== null).toBe(status !== "empty");
      if (badge) fills.add(getComputedStyle(badge).fill);
    }
    // Blue, slate and amber badges
    expect(fills.size).toBe(3);
  });

  test("a caption of its own wins; label says more; with no words it's decorative", async () => {
    const el = await fixture<TcFolderStatus>(html`<tc-folder-status status="locked" caption="On legal hold"></tc-folder-status>`);
    expect(el.getAttribute("aria-label")).toBe("On legal hold");
    el.label = "Locked for legal review";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Locked for legal review");
    el.label = "";
    el.caption = "";
    await settle();
    expect(el.querySelector(".ui-fds-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    el.caption = undefined;
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Locked folder");
  });

  test("off screen the motion holds; every status's motion is finite", async () => {
    expect(TcFolderStatus.css).not.toMatch(/\binfinite\b/);
    const el = await fixture<TcFolderStatus>(html`<tc-folder-status status="shared" style="position: absolute; top: 5000px; width: 200px"></tc-folder-status>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-fds-mark")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
    for (const [status, cls] of [["empty", "flap"], ["shared", "mark"], ["archived", "arrow"], ["locked", "mark"]] as const) {
      el.status = status;
      await settle();
      const cs = getComputedStyle(el.querySelector(`.ui-fds-${cls}`)!);
      expect(cs.animationName).not.toBe("none");
      expect(cs.animationIterationCount).toBe("3");
    }
  });

  test("dark follows color-scheme", async () => {
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-folder-status status="shared"></tc-folder-status></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-fds-front")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcFolderStatus>();
    await act(async () => root.render(React.createElement(FolderStatus, { className: "mine", status: "archived", ref })));
    await settle();
    const el = host.querySelector<TcFolderStatus>("tc-folder-status")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Archived");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations for every status, in both themes", async () => {
    for (const scheme of ["light", "dark"])
      for (const status of STATUSES) {
        const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-folder-status status=${status}></tc-folder-status></div>`);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => v.id)).toEqual([]);
      }
  });
});
