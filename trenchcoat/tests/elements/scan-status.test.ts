/*
 * <tc-scan-status> in real browsers: each state's mark and word, progress, card details and picture, actions,
 * announcements, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/scan-status";
import type { ScanActionDetail, TcScanStatus } from "../../src/elements/scan-status";
import { ScanStatus } from "../../src/elements/react/scan-status";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const scan = (state: string) => fixture<TcScanStatus>(html`<tc-scan-status file-name="a.zip" state=${state}></tc-scan-status>`);

describe("tc-scan-status", () => {
  const words = { queued: "Waiting to scan", scanning: "Scanning", clean: "No threats found", suspicious: "Suspicious", quarantined: "Quarantined", failed: "Scan failed" };
  for (const [state, word] of Object.entries(words)) {
    test(`${state} has a mark and a word`, async () => {
      const el = await scan(state);
      expect(el.dataset.ui).toBe("scn");
      expect(text(el.querySelector(".ui-scn__word"))).toBe(word);
      expect(el.querySelector(".ui-scn__mark")).toBeTruthy();
    });
  }

  test("an unknown state reads as queued", async () => {
    expect(text((await scan("odd")).querySelector(".ui-scn__word"))).toBe("Waiting to scan");
  });

  test("progress shows only while scanning, and is clamped", async () => {
    const el = await fixture<TcScanStatus>(html`<tc-scan-status state="scanning" progress="1.4"></tc-scan-status>`);
    expect(el.querySelector('[role="progressbar"]')!.getAttribute("aria-valuenow")).toBe("100");
    el.state = "clean";
    await settle();
    expect(el.querySelector('[role="progressbar"]')).toBeNull();
  });

  test("actions fit the state, and report it", async () => {
    const seen: ScanActionDetail[] = [];
    const failed = await scan("failed");
    failed.addEventListener("tc-action", (e) => seen.push((e as CustomEvent<ScanActionDetail>).detail));
    expect(text(failed.querySelector(".ui-scn__action"))).toContain("Rescan");
    failed.querySelector<HTMLElement>(".ui-scn__action")!.click();
    expect(seen[0]).toEqual({ action: "rescan", state: "failed" });
    const held = await scan("quarantined");
    held.addEventListener("tc-action", (e) => seen.push((e as CustomEvent<ScanActionDetail>).detail));
    held.querySelector<HTMLElement>(".ui-scn__action")!.click();
    expect(seen[1]).toEqual({ action: "request-review", state: "quarantined" });
    expect((await scan("clean")).querySelector(".ui-scn__action")).toBeNull();
  });

  test("changes are announced, but not the first state", async () => {
    const el = await scan("scanning");
    const status = el.querySelector('[role="status"]')!;
    expect(text(status)).toBe("");
    el.state = "clean";
    await settle();
    expect(text(el.querySelector('[role="status"]'))).toBe("a.zip: No threats found");
  });

  test("the card has the file, details and, in quarantine, the picture", async () => {
    const el = await fixture<TcScanStatus>(html`<tc-scan-status layout="card" file-name="a.zip" state="quarantined" engine="Scanner" detail="Hides itself" .scannedAt=${0} locale="en-GB"></tc-scan-status>`);
    expect(text(el)).toContain("a.zip");
    expect(el.querySelector("tc-malware-blocked")).toBeTruthy();
    expect(text(el.querySelector(".ui-scn__detail"))).toBe("Hides itself");
    expect(text(el.querySelector(".ui-scn__facts"))).toContain("Scanned by Scanner");
    expect(getComputedStyle(el).display).toBe("block");
    el.state = "clean";
    await settle();
    expect(el.querySelector("tc-malware-blocked")).toBeNull();
  });

  test("inline never shows the picture", async () => {
    expect((await scan("quarantined")).querySelector("tc-malware-blocked")).toBeNull();
  });

  test("labels can be renamed", async () => {
    const el = await scan("clean");
    el.labels = { clean: "Safe so far" };
    await settle();
    expect(text(el.querySelector(".ui-scn__word"))).toBe("Safe so far");
  });
});

describe("React", () => {
  test("props and events pass through", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const seen: string[] = [];
    await act(async () => root.render(React.createElement(ScanStatus, { state: "failed", fileName: "a.zip", onTcAction: (e: CustomEvent<ScanActionDetail>) => seen.push(e.detail.action) })));
    await settle();
    const el = host.querySelector<TcScanStatus>("tc-scan-status")!;
    expect(el.fileName).toBe("a.zip");
    await act(async () => el.querySelector<HTMLElement>(".ui-scn__action")!.click());
    expect(seen).toEqual(["rescan"]);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}>
          <tc-scan-status file-name="a.zip" state="scanning" progress="0.5"></tc-scan-status>
          <tc-scan-status file-name="b.zip" state="suspicious"></tc-scan-status>
          <tc-scan-status layout="card" file-name="c.zip" state="quarantined" detail="Hides itself"></tc-scan-status>
        </div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
