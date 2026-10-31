/*
 * <tc-file-details> in real browsers: the file's details, the flag, sections left out when empty, sharing kept in step,
 * Open, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/file-details";
import type { FileDetailsFlagChange, TcFileDetails } from "../../src/elements/file-details";
import type { ShareEntitlementCheck, ShareRecipient } from "../../src/elements/share-panel";
import type { TeamFlag } from "../../src/elements/team-flag-picker";
import { FileDetails } from "../../src/elements/react/file-details";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const FILE = { name: "Trial 12.pdf", size: 2400000, owner: "Noor Haddad", modified: Date.UTC(2026, 9, 12) };
const FLAGS: TeamFlag[] = [
  { id: "review", label: "Needs review", meaning: "Read twice.", color: "#CA8A04" },
  { id: "final", label: "Final", color: "#16A34A" },
];
const NOOR: ShareRecipient = { id: "noor", kind: "person", name: "Noor Haddad" };
const check: ShareEntitlementCheck = async () => ({ status: "allowed" });
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const details = () => fixture<TcFileDetails>(html`<tc-file-details .file=${FILE} .flags=${FLAGS} flag="review" .directory=${[NOOR]} .checkEntitlement=${check}></tc-file-details>`);
const pick = async (el: TcFileDetails, index: number) => {
  el.querySelector<HTMLElement>(".ui-tfp__trigger")!.click();
  await settle();
  await expect.poll(() => el.querySelector(".ui-tfp__pop")).toBeTruthy();
  el.querySelectorAll<HTMLElement>('[role="option"]')[index]!.click();
  await settle();
};

describe("tc-file-details", () => {
  test("shows the file's name as a heading, with its details", async () => {
    const el = await details();
    expect(el.dataset.ui).toBe("fld");
    expect(text(el.querySelector("h2"))).toBe("Trial 12.pdf");
    const meta = text(el.querySelector(".ui-fld__meta"));
    expect(meta).toContain("2.3 MB");
    expect(meta).toContain("Noor Haddad");
  });

  test("the flag is the team's, and changes report tc-flag-change only", async () => {
    const el = await details();
    const events: FileDetailsFlagChange[] = [];
    let inner = 0;
    el.addEventListener("tc-flag-change", (e) => events.push((e as CustomEvent<FileDetailsFlagChange>).detail));
    el.addEventListener("tc-value-change", () => inner++);
    expect(text(el.querySelector(".ui-tfp__trigger"))).toContain("Needs review");
    await pick(el, 2);
    expect(el.flag).toBe("final");
    expect(events).toEqual([{ flag: "final", value: FLAGS[1] }]);
    expect(inner).toBe(0);
  });

  test("preventDefault keeps the flag, in the block and in its picker", async () => {
    const el = await details();
    el.addEventListener("tc-flag-change", (e) => e.preventDefault());
    await pick(el, 2);
    expect(el.flag).toBe("review");
    expect(el.querySelector("tc-team-flag-picker")!.value).toBe("review");
  });

  test("a section with nothing to show is left out", async () => {
    const el = await details();
    expect(el.querySelector("tc-file-summary")).toBeNull();
    expect(el.querySelector("tc-version-history")).toBeNull();
    el.summary = "What's in it.";
    el.summaryStatus = "done";
    el.versions = [{ id: "v1", label: "v1", status: "active" }];
    await settle();
    expect(text(el.querySelector("tc-file-summary"))).toContain("What's in it.");
    expect(el.querySelector("tc-version-history")).toBeTruthy();
  });

  const share = async (el: TcFileDetails) => {
    const panel = el.querySelector("tc-share-panel")!;
    const input = panel.querySelector<HTMLInputElement>(".ui-shr__search")!;
    input.focus();
    input.value = "Noor";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    panel.querySelector<HTMLElement>(".ui-shr__result")!.click();
    await settle();
    await expect.poll(() => panel.querySelector<HTMLElement>('[data-recipient="noor"]')?.dataset.status).toBe("allowed");
    await settle();
    panel.querySelector<HTMLElement>(".ui-shr__share")!.click();
    await settle();
  };

  test("sharing is checked, and access follows the share", async () => {
    const el = await details();
    expect(text(el.querySelector("tc-share-panel"))).toContain("Share Trial 12.pdf");
    await share(el);
    expect(el.access.map((g) => g.recipient.id)).toEqual(["noor"]);
  });

  test("preventDefault on tc-share at the block keeps access", async () => {
    const el = await details();
    el.addEventListener("tc-share", (e) => e.preventDefault());
    await share(el);
    expect(el.access).toEqual([]);
    expect(el.querySelector("tc-share-panel")!.access).toEqual([]);
  });

  test("Open is a link with href, and an event without", async () => {
    const el = await details();
    let opened = 0;
    el.addEventListener("tc-open", () => opened++);
    el.querySelector<HTMLElement>(".ui-fld__open")!.click();
    expect(opened).toBe(1);
    el.href = "/files/12";
    await settle();
    expect(el.querySelector(".ui-fld__open")!.getAttribute("href")).toBe("/files/12");
  });

  test("an unsafe preview or link is dropped", async () => {
    const el = await details();
    el.file = { ...FILE, preview: "javascript:alert(1)" };
    el.href = "javascript:alert(1)";
    await settle();
    expect(el.querySelector(".ui-fld__image")).toBeNull();
    expect(el.querySelector(".ui-fld__open")!.getAttribute("href")).toBe("#");
  });

  test("goes to one column when narrow", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 500px"><tc-file-details .file=${FILE}></tc-file-details></div>`);
    const columns = getComputedStyle(wrap.querySelector(".ui-fld__grid")!).gridTemplateColumns.split(" ");
    expect(columns).toHaveLength(1);
  });
});

describe("React", () => {
  test("an uncontrolled flag survives the parent re-rendering", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = () => React.createElement(FileDetails, { file: FILE, flags: FLAGS, defaultFlag: "review" });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcFileDetails>("tc-file-details")!;
    await act(async () => pick(el, 2));
    await act(async () => root.render(node()));
    await settle();
    expect(el.flag).toBe("final");
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}`}>
          <tc-file-details .file=${FILE} .flags=${FLAGS} flag="review" summary-status="done" summary="What's in it." .directory=${[NOOR]} .checkEntitlement=${check} .access=${[{ recipient: NOOR, level: "view" }]}></tc-file-details>
        </div>`);
        await settle();
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
