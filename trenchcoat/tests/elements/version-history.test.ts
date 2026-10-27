/*
 * <tc-version-history> in real browsers – the timeline listbox and its detail, statuses and changes by behaviour,
 * compare (picked, gathered, resolved, failed, taken over by the app), restore, the confirmed activation, controlled
 * use, windowing with 2,000 versions, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/version-history";
import type {
  TcVersionHistory,
  VersionActivateDetail,
  VersionChange,
  VersionCompareDetail,
  VersionEntry,
  VersionRestoreDetail,
  VersionSelectDetail,
} from "../../src/elements/version-history";
import { VersionHistory } from "../../src/elements/react/version-history";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const VERSIONS: VersionEntry[] = [
  {
    id: "v4",
    label: "v1.3",
    status: "draft",
    note: "Tighter review step",
    author: "Sam Ortiz",
    at: "Today · 09:12",
    changes: [
      { kind: "changed", text: "Flags an item as urgent from a score of 0.9 (was 0.85)" },
      { kind: "added", text: "Asks a lead to approve before sending when anything is urgent" },
      { kind: "removed", text: "No longer exports to shared drives" },
    ],
  },
  { id: "v3", label: "v1.2", status: "active", note: "Groups related items", author: "Dee Okafor", at: "May 28 · 14:40", changes: [{ kind: "added", text: "Groups related items before ranking them" }] },
  { id: "v2", label: "v1.1", status: "deprecated", note: "Sources on every summary", author: "Sam Ortiz", at: "May 12 · 10:05", changes: [{ kind: "changed", text: "Every summary cites its sources" }] },
  { id: "v1", label: "v1.0", status: "deprecated", note: "First version", author: "Sam Ortiz", at: "Apr 30 · 16:22" },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-vhist__row")];
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-vhist__row[data-id="${id}"]`)!;
const acts = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-vhist__act")];
const said = (el: Element) => text(el.querySelector('[role="status"]'));
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const make = (versions = VERSIONS) => fixture<TcVersionHistory>(html`<tc-version-history .versions=${versions}></tc-version-history>`);

describe("tc-version-history", () => {
  test("the host is the root and a region named by the heading; the header says which version is active", async () => {
    const el = await make();
    expect(el.dataset.ui).toBe("vhist");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Version history");
    expect(el.querySelector(".tc-head h3")!.textContent).toBe("Version history");
    expect(text(el.querySelector(".tc-head__sub"))).toBe("What each version does differently");
    expect(text(el.querySelector(".ui-vhist__live"))).toBe("v1.2 active");
    expect(el.activeVersion!.id).toBe("v3");
    el.heading = "Briefing agent";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Briefing agent");
  });

  test("the timeline is a listbox of the versions, newest first, each with its status, time and note", async () => {
    const el = await make();
    const list = el.querySelector(".ui-vhist__rows")!;
    expect(list.getAttribute("role")).toBe("listbox");
    expect(list.hasAttribute("aria-multiselectable")).toBe(false);
    expect(rows(el).map((r) => r.dataset.id)).toEqual(["v4", "v3", "v2", "v1"]);
    expect(rows(el).map((r) => r.getAttribute("role"))).toEqual(["option", "option", "option", "option"]);
    expect(text(row(el, "v4"))).toBe("v1.3 Draft Today · 09:12 Tighter review step, by Sam Ortiz");
    expect(row(el, "v4").getAttribute("aria-posinset")).toBe("1");
    expect(row(el, "v4").getAttribute("aria-setsize")).toBe("4");
    // The draft is shown first, and has the tab stop
    expect(row(el, "v4").getAttribute("aria-selected")).toBe("true");
    expect(rows(el).map((r) => r.tabIndex)).toEqual([0, -1, -1, -1]);
    expect(text(el.querySelector(".ui-vhist__count"))).toBe("4 versions");
  });

  test("without a draft the active version is shown; with neither, the newest", async () => {
    const el = await make(VERSIONS.slice(1));
    expect(el.current!.id).toBe("v3");
    el.versions = VERSIONS.slice(2);
    await settle();
    expect(el.current!.id).toBe("v2");
  });

  test("the detail lists the changes by behaviour: + added, − removed, ~ changed, with words for screen readers", async () => {
    const el = await make();
    const detail = el.querySelector(".ui-vhist__detail")!;
    expect(text(detail.querySelector(".ui-vhist__dt-label"))).toBe("v1.3");
    expect(text(detail.querySelector(".ui-vhist__meta"))).toBe("Today · 09:12 · Sam Ortiz");
    const changes = [...detail.querySelectorAll(".ui-vhist__change")];
    expect(changes.map((c) => (c as HTMLElement).dataset.kind)).toEqual(["changed", "added", "removed"]);
    expect(changes.map((c) => text(c.querySelector(".ui-vhist__sign")))).toEqual(["~", "+", "−"]);
    expect(text(changes[1])).toBe("+Added: Asks a lead to approve before sending when anything is urgent");
    expect(detail.querySelector(".ui-vhist__changes")!.getAttribute("aria-label")).toBe("Changes in v1.3");
    // A draft says the active version stays until it's approved
    expect(text(detail.querySelector(".ui-vhist__callout"))).toBe("v1.2 stays active until this draft is approved.");
    // A version with no changes says so
    row(el, "v1").click();
    await settle();
    expect(text(el.querySelector(".ui-vhist__detail .ui-vhist__quiet"))).toBe("No changes in behaviour.");
  });

  test("selection: click and arrows select (cancelable tc-select-change); the detail follows", async () => {
    const el = await make();
    const seen: VersionSelectDetail[] = [];
    el.addEventListener("tc-select-change", (e) => seen.push((e as CustomEvent<VersionSelectDetail>).detail));
    row(el, "v2").click();
    await settle();
    expect(el.selected).toBe("v2");
    expect(document.activeElement).toBe(row(el, "v2"));
    expect(text(el.querySelector(".ui-vhist__dt-label"))).toBe("v1.1");
    await key(row(el, "v2"), "ArrowDown");
    expect(document.activeElement).toBe(row(el, "v1"));
    expect(el.selected).toBe("v1");
    await key(row(el, "v1"), "ArrowDown");
    expect(document.activeElement).toBe(row(el, "v1"));
    await key(row(el, "v1"), "Home");
    expect(el.selected).toBe("v4");
    await key(row(el, "v4"), "End");
    expect(el.selected).toBe("v1");
    await key(row(el, "v1"), "PageUp");
    expect(el.selected).toBe("v4");
    await key(row(el, "v4"), "PageDown");
    expect(el.selected).toBe("v1");
    await key(row(el, "v1"), "ArrowUp");
    expect(el.selected).toBe("v2");
    expect(seen.map((d) => d.id)).toEqual(["v2", "v1", "v4", "v1", "v4", "v1", "v2"]);
    expect(seen[0].version.label).toBe("v1.1");
    // Controlled: prevented, the selection stays while focus moves
    el.addEventListener("tc-select-change", (e) => e.preventDefault());
    await key(row(el, "v2"), "ArrowUp");
    expect(document.activeElement).toBe(row(el, "v3"));
    expect(el.selected).toBe("v2");
    expect(row(el, "v2").getAttribute("aria-selected")).toBe("true");
  });

  test("actions by status: a draft can be approved, a past version restored, and either compared with the active one", async () => {
    const el = await make();
    expect(acts(el).map(text)).toEqual(["Approve and activate", "Compare with v1.2"]);
    expect(el.querySelector(".ui-vhist__acts")!.getAttribute("role")).toBe("toolbar");
    row(el, "v3").click();
    await settle();
    expect(acts(el)).toEqual([]);
    expect(el.querySelector(".ui-vhist__acts")).toBeNull();
    row(el, "v2").click();
    await settle();
    expect(acts(el).map(text)).toEqual(["Restore as draft", "Compare with v1.2"]);
    el.canRestore = false;
    await settle();
    expect(acts(el).map(text)).toEqual(["Compare with v1.2"]);
  });

  test("the actions are a toolbar: one tab stop, arrow keys", async () => {
    const el = await make();
    expect(acts(el).map((b) => b.tabIndex)).toEqual([0, -1]);
    acts(el)[0].focus();
    await key(acts(el)[0], "ArrowRight");
    expect(document.activeElement).toBe(acts(el)[1]);
    await key(acts(el)[1], "ArrowRight");
    expect(document.activeElement).toBe(acts(el)[0]);
    await key(acts(el)[0], "End");
    expect(document.activeElement).toBe(acts(el)[1]);
  });

  test("approve and activate asks first in a modal dialog; Escape cancels and focus returns", async () => {
    const el = await make();
    const approve = acts(el)[0];
    expect(approve.getAttribute("aria-haspopup")).toBe("dialog");
    approve.focus();
    approve.click();
    await settle();
    const dialog = el.querySelector<HTMLDialogElement>(".ui-vhist__dialog")!;
    expect(dialog.open).toBe(true);
    expect(text(dialog.querySelector(".ui-vhist__dlg-title"))).toBe("Activate v1.3?");
    expect(text(dialog.querySelector(".ui-vhist__dlg-desc p"))).toBe("v1.3 becomes the active version and v1.2 is deprecated. 3 changes take effect:");
    expect(dialog.querySelectorAll(".ui-vhist__change")).toHaveLength(3);
    expect(document.activeElement).toBe(dialog.querySelector(".ui-vhist__cancel"));
    // Tab stays inside
    const confirm = dialog.querySelector<HTMLButtonElement>(".ui-vhist__confirm")!;
    confirm.focus();
    await key(confirm, "Tab");
    expect(document.activeElement).toBe(dialog.querySelector(".ui-vhist__cancel"));
    await key(document.activeElement!, "Tab", { shiftKey: true });
    expect(document.activeElement).toBe(confirm);
    await key(confirm, "Escape");
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(approve);
    expect(el.versions).toBe(VERSIONS);
  });

  test("confirming activates the draft: tc-activate, the old active version deprecated, announced", async () => {
    const el = await make();
    const seen: VersionActivateDetail[] = [];
    el.addEventListener("tc-activate", (e) => seen.push((e as CustomEvent<VersionActivateDetail>).detail));
    acts(el)[0].click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-vhist__confirm")!.click();
    await settle();
    expect(seen).toHaveLength(1);
    expect(seen[0].version).toMatchObject({ id: "v4", status: "active" });
    expect(seen[0].previous!.id).toBe("v3");
    expect(seen[0].versions.map((v) => v.status)).toEqual(["active", "deprecated", "deprecated", "deprecated"]);
    expect(el.versions.map((v) => v.status)).toEqual(["active", "deprecated", "deprecated", "deprecated"]);
    expect(el.querySelector<HTMLDialogElement>(".ui-vhist__dialog")!.open).toBe(false);
    expect(text(el.querySelector(".ui-vhist__live"))).toBe("v1.3 active");
    expect(said(el)).toBe("v1.3 is active. v1.2 is deprecated.");
    expect(document.activeElement).toBe(row(el, "v4"));
  });

  test("controlled activation: preventDefault keeps `versions`", async () => {
    const el = await make();
    el.addEventListener("tc-activate", (e) => e.preventDefault());
    acts(el)[0].click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-vhist__confirm")!.click();
    await settle();
    expect(el.versions).toBe(VERSIONS);
    expect(el.querySelector<HTMLDialogElement>(".ui-vhist__dialog")!.open).toBe(false);
  });

  test("activate-blocked: the button stays focusable, says why and opens nothing", async () => {
    const el = await fixture<TcVersionHistory>(html`<tc-version-history activate-blocked="Only an owner can approve this draft." .versions=${VERSIONS}></tc-version-history>`);
    const approve = acts(el)[0];
    expect(approve.getAttribute("aria-disabled")).toBe("true");
    expect(text(el.querySelector(`#${approve.getAttribute("aria-describedby")}`))).toBe("Only an owner can approve this draft.");
    approve.click();
    await settle();
    expect(el.querySelector<HTMLDialogElement>(".ui-vhist__dialog")!.open).toBe(false);
  });

  test("restore: a cancelable tc-restore; the version shows it's requested until a new list arrives, then the new draft shows", async () => {
    const el = await make(VERSIONS.slice(1));
    const seen: VersionRestoreDetail[] = [];
    el.addEventListener("tc-restore", (e) => seen.push((e as CustomEvent<VersionRestoreDetail>).detail));
    row(el, "v2").click();
    await settle();
    acts(el)[0].click();
    await settle();
    expect(seen.map((d) => d.version.id)).toEqual(["v2"]);
    expect(text(acts(el)[0])).toBe("Restore requested");
    expect(acts(el)[0].getAttribute("aria-disabled")).toBe("true");
    expect(said(el)).toBe("Restore of v1.1 requested.");
    acts(el)[0].click();
    await settle();
    expect(seen).toHaveLength(1);
    // The app answers with a new draft
    el.versions = [{ id: "v5", label: "v1.3", status: "draft", note: "Restored from v1.1", changes: [{ kind: "removed", text: "No longer groups related items" }] }, ...VERSIONS.slice(1)];
    await settle();
    expect(el.selected).toBe("v5");
    expect(text(el.querySelector(".ui-vhist__dt-label"))).toBe("v1.3");
    row(el, "v2").click();
    await settle();
    expect(text(acts(el)[0])).toBe("Restore as draft");
    // Prevented, nothing is pending
    el.addEventListener("tc-restore", (e) => e.preventDefault());
    acts(el)[0].click();
    await settle();
    expect(text(acts(el)[0])).toBe("Restore as draft");
  });

  test("compare: pick two in the list; the detail sums up the changes in between, older to newer", async () => {
    const el = await make();
    const seen: VersionCompareDetail[] = [];
    el.addEventListener("tc-compare", (e) => seen.push((e as CustomEvent<VersionCompareDetail>).detail));
    const toggle = el.querySelector<HTMLButtonElement>(".ui-vhist__toggle")!;
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    const list = el.querySelector(".ui-vhist__rows")!;
    expect(list.getAttribute("aria-multiselectable")).toBe("true");
    expect(list.getAttribute("aria-label")).toBe("Versions – pick two to compare");
    // The version you were on is the first pick
    expect(rows(el).map((r) => r.getAttribute("aria-selected"))).toEqual(["true", "false", "false", "false"]);
    expect(text(el.querySelector(".ui-vhist__count"))).toBe("Pick 1 more version");
    expect(said(el)).toBe("Compare: pick two versions.");
    row(el, "v4").focus();
    await key(row(el, "v4"), "End");
    expect(document.activeElement).toBe(row(el, "v1"));
    await key(row(el, "v1"), " ");
    expect(seen).toHaveLength(1);
    expect(seen[0].from.id).toBe("v1");
    expect(seen[0].to.id).toBe("v4");
    expect(seen[0].changes).toHaveLength(5);
    const detail = el.querySelector(".ui-vhist__detail")!;
    expect(text(detail.querySelector(".ui-vhist__dt-label"))).toBe("v1.0 →to v1.3");
    expect(text(detail.querySelector(".ui-vhist__meta"))).toBe("3 versions apart");
    expect(detail.querySelectorAll(".ui-vhist__change")).toHaveLength(5);
    expect(said(el)).toBe("v1.0 to v1.3: 5 changes.");
    // Enter on a picked one unpicks it
    await key(row(el, "v1"), "Enter");
    expect(rows(el).filter((r) => r.getAttribute("aria-selected") === "true").map((r) => r.dataset.id)).toEqual(["v4"]);
    // A third pick replaces the oldest pick
    row(el, "v3").click();
    await settle();
    row(el, "v2").click();
    await settle();
    expect(rows(el).filter((r) => r.getAttribute("aria-selected") === "true").map((r) => r.dataset.id)).toEqual(["v3", "v2"]);
    expect(seen.at(-1)!.from.id).toBe("v2");
    expect(seen.at(-1)!.to.id).toBe("v3");
    // Escape leaves compare
    await key(row(el, "v2"), "Escape");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(el.querySelector(".ui-vhist__rows")!.hasAttribute("aria-multiselectable")).toBe(false);
  });

  test("compare with the active version picks the pair in one step", async () => {
    const el = await make();
    const btn = acts(el).find((b) => text(b) === "Compare with v1.2")!;
    btn.click();
    await settle();
    expect(text(el.querySelector(".ui-vhist__dt-label"))).toBe("v1.2 →to v1.3");
    expect(text(el.querySelector(".ui-vhist__meta"))).toBe("One version apart");
    expect(el.querySelectorAll(".ui-vhist__detail .ui-vhist__change")).toHaveLength(3);
  });

  test("resolveCompare: loading, the app's answer, an error with retry; a new pair aborts the old", async () => {
    const el = await make();
    const calls: { from: string; to: string; signal: AbortSignal; resolve: (c: VersionChange[]) => void; reject: (e: unknown) => void }[] = [];
    el.resolveCompare = (from, to, signal) => new Promise((resolve, reject) => calls.push({ from: from.id, to: to.id, signal, resolve, reject }));
    acts(el).find((b) => text(b) === "Compare with v1.2")!.click();
    await settle();
    expect(text(el.querySelector(".ui-vhist__loading"))).toBe("Comparing…");
    expect(calls[0]).toMatchObject({ from: "v3", to: "v4" });
    calls[0].reject(new Error("offline"));
    await settle();
    expect(text(el.querySelector(".ui-vhist__error"))).toBe("Couldn't compare these versions. Try again");
    expect(said(el)).toBe("Couldn't compare v1.2 with v1.3.");
    el.querySelector<HTMLButtonElement>(".ui-vhist__retry")!.click();
    await settle();
    expect(calls).toHaveLength(2);
    calls[1].resolve([{ kind: "added", text: "From the app" }]);
    await settle();
    expect(text(el.querySelector(".ui-vhist__detail .ui-vhist__change"))).toBe("+Added: From the app");
    // Another pair: the pending one is aborted
    row(el, "v1").click();
    await settle();
    expect(calls).toHaveLength(3);
    row(el, "v2").click();
    await settle();
    expect(calls[2].signal.aborted).toBe(true);
  });

  test("compare taken over by the app: preventDefault shows no summary", async () => {
    const el = await make();
    el.addEventListener("tc-compare", (e) => e.preventDefault());
    acts(el).find((b) => text(b) === "Compare with v1.2")!.click();
    await settle();
    expect(el.querySelectorAll(".ui-vhist__detail .ui-vhist__change")).toHaveLength(0);
    expect(text(el.querySelector(".ui-vhist__detail .ui-vhist__quiet"))).toBe("Opened in the comparison view.");
  });

  test("labels are properties; an empty history says so", async () => {
    const el = await fixture<TcVersionHistory>(html`<tc-version-history
      .versions=${VERSIONS}
      .statusLabels=${{ draft: "Proposed" }}
      .changeLabels=${{ added: "New" }}
      activate-label="Publish"
      compare-label="Diff"
    ></tc-version-history>`);
    expect(text(el.querySelector(".ui-vhist__pill"))).toBe("Proposed");
    expect(text(el.querySelectorAll(".ui-vhist__change")[1])).toContain("New: ");
    expect(acts(el).map(text)).toEqual(["Publish", "Diff with v1.2"]);
    const empty = await fixture<TcVersionHistory>(html`<tc-version-history></tc-version-history>`);
    expect(text(empty.querySelector(".ui-vhist__empty"))).toBe("No versions yet – the first one appears here once it's saved.");
    expect(empty.querySelector('[role="listbox"]')).toBeNull();
  });

  test("windowing: 2,000 versions render only the rows near the viewport; End reaches the last", async () => {
    const many: VersionEntry[] = Array.from({ length: 2000 }, (_, i) => ({ id: `m${i}`, label: `v${2000 - i}`, status: i === 0 ? "active" : "deprecated", note: `Version ${2000 - i}` }));
    const el = await make(many);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await settle();
    expect(rows(el).length).toBeLessThan(120);
    expect(rows(el)[0].getAttribute("aria-setsize")).toBe("2000");
    expect(el.querySelector<HTMLElement>(".ui-vhist__rows")!.scrollHeight).toBeGreaterThan(2000 * 40);
    row(el, "m0").focus();
    await key(row(el, "m0"), "End");
    for (let i = 0; i < 2; i++) {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await settle();
    }
    expect((document.activeElement as HTMLElement).dataset.id).toBe("m1999");
    expect(el.selected).toBe("m1999");
    expect(rows(el).length).toBeLessThan(120);
  });

  test("clean: one card, the header as its first row", async () => {
    const el = await fixture<TcVersionHistory>(html`<tc-version-history look="clean" .versions=${VERSIONS}></tc-version-history>`);
    expect(el.dataset.look).toBe("clean");
    expect(el.firstElementChild!.classList.contains("tc-head")).toBe(true);
  });

  test("React: controlled versions survive a parent re-render; onActivate and onSelectedChange fire", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picked: string[] = [];
    let activated = 0;
    let rerender: (n: number) => void = () => {};
    function App() {
      const [versions, setVersions] = React.useState(VERSIONS);
      const [n, set] = React.useState(0);
      rerender = set;
      return React.createElement(VersionHistory, {
        "data-n": n,
        title: "Agent versions",
        versions,
        onVersionsChange: setVersions,
        onSelectedChange: (id: string) => picked.push(id),
        onActivate: () => activated++,
      } as React.ComponentProps<typeof VersionHistory>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcVersionHistory>("tc-version-history")!;
    expect(el.getAttribute("aria-label")).toBe("Agent versions");
    await act(async () => row(el, "v2").click());
    await act(async () => rerender(1));
    await settle();
    expect(picked).toEqual(["v2"]);
    expect(el.selected).toBe("v2");
    await act(async () => row(el, "v4").click());
    await settle();
    await act(async () => acts(el)[0].click());
    await settle();
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-vhist__confirm")!.click());
    await settle();
    expect(activated).toBe(1);
    expect(el.versions[0].status).toBe("active");
    await act(async () => rerender(2));
    await settle();
    expect(el.versions[0].status).toBe("active");
    await act(async () => root.unmount());
  });

  test("React uncontrolled: defaultVersions keep an activation across parent renders", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, set] = React.useState(0);
      rerender = set;
      return React.createElement(VersionHistory, { "data-n": n, defaultVersions: VERSIONS } as React.ComponentProps<typeof VersionHistory>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcVersionHistory>("tc-version-history")!;
    await act(async () => acts(el)[0].click());
    await settle();
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-vhist__confirm")!.click());
    await act(async () => rerender(1));
    await settle();
    expect(el.versions[0].status).toBe("active");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"])
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="background: ${theme === "dark" ? "#0e0e10" : "#fff"}; padding: 8px; width: 720px">
        <tc-version-history .versions=${VERSIONS}></tc-version-history>
        <tc-version-history look="clean" heading="Clean history" .versions=${VERSIONS}></tc-version-history>
        <tc-version-history look="clean" heading="Empty history"></tc-version-history>
      </div>`);
      const [, clean] = [...wrap.querySelectorAll<TcVersionHistory>("tc-version-history")];
      acts(clean).find((b) => text(b).startsWith("Compare"))!.click();
      await settle();
      await Promise.all(document.getAnimations().map((x) => (x.finish(), x.finished)));
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("axe: the confirmation dialog", async () => {
    const el = await make();
    acts(el)[0].click();
    await settle();
    await Promise.all(document.getAnimations().map((x) => (x.finish(), x.finished)));
    const result = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => v.id)).toEqual([]);
  });
});
