/*
 * <tc-evidence-coverage> in real browsers: the host and both looks, the rows and the summary, status labels, the
 * request flow (no resolver, resolver success, failure and retry, prevented with the app's own state), focus after a
 * request, the inline disclosure, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/evidence-coverage";
import type { CoverageSource, TcEvidenceCoverage } from "../../src/elements/evidence-coverage";
import { EvidenceCoverage } from "../../src/elements/react/evidence-coverage";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const SOURCES: CoverageSource[] = [
  { id: "a", label: "Sales", status: "current", detail: "Synced today" },
  { id: "b", label: "Filings", status: "stale", age: "14 months" },
  { id: "c", label: "Field reports", status: "none" },
];
const make = (look = "standard", sources = SOURCES) =>
  fixture<TcEvidenceCoverage>(html`<tc-evidence-coverage look=${look} scope="For this answer" .sources=${sources}></tc-evidence-coverage>`);
const row = (el: Element, i: number) => el.querySelectorAll<HTMLElement>(".ui-evc__row")[i];
const btn = (el: Element, i: number) => row(el, i).querySelector<HTMLButtonElement>("button");

describe("tc-evidence-coverage", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a region named by its heading, with the count in the header and the summary first`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("evc");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Evidence coverage");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("For this answer");
      expect(plain(el.querySelector(".ui-evc__pill")!.textContent)).toBe("1 of 3 current");
      expect(plain(el.querySelector(".ui-evc__summary")!.textContent)).toBe("Couldn't see Field reports. Filings (14 months) is out of date.");
      // Standard: the header sits on the tray before the card; Clean: inside it
      expect(!!el.querySelector(".ui-evc__card .tc-head")).toBe(look === "clean");
    });
  }

  test("one row per source with its state; stale shows its age as given; only gaps can be requested", async () => {
    const el = await make();
    expect([...el.querySelectorAll(".ui-evc__state")].map((s) => s.textContent)).toEqual(["Current", "Stale · 14 months", "No coverage"]);
    expect(row(el, 0).querySelector(".ui-evc__detail")!.textContent).toBe("Synced today");
    expect(btn(el, 0)).toBeNull();
    expect(btn(el, 1)!.getAttribute("aria-label")).toBe("Request coverage for Filings");
    expect(plain(btn(el, 2)!.textContent)).toBe("Request coverage");
    el.requestable = false;
    await settle();
    expect(el.querySelectorAll(".ui-evc__row button").length).toBe(0);
  });

  test("the summary covers every case, and can be replaced; labels are properties", async () => {
    const el = await make("standard", [{ id: "a", label: "A", status: "current" }]);
    expect(plain(el.querySelector(".ui-evc__summary")!.textContent)).toBe("Every source is current.");
    expect(el.dataset.tone).toBe("current");
    el.sources = [
      { id: "a", label: "A", status: "stale" },
      { id: "b", label: "B", status: "stale", age: "3d" },
    ];
    await settle();
    expect(plain(el.querySelector(".ui-evc__summary")!.textContent)).toBe("A and B (3d) are out of date.");
    expect(el.dataset.tone).toBe("stale");
    el.statusLabels = { stale: "Old" };
    el.requestLabel = "Ask for it";
    await settle();
    expect(row(el, 1).querySelector(".ui-evc__state")!.textContent).toBe("Old · 3d");
    expect(plain(btn(el, 0)!.textContent)).toBe("Ask for it");
    el.summary = "Mostly fine.";
    await settle();
    expect(plain(el.querySelector(".ui-evc__summary")!.textContent)).toBe("Mostly fine.");
    el.sources = [];
    el.summary = "";
    await settle();
    expect(plain(el.querySelector(".ui-evc__summary")!.textContent)).toBe("No sources to show.");
    expect(el.querySelector(".ui-evc__pill")).toBeNull();
  });

  test("a request without a resolver: tc-coverage-request, then Requested – focus stays on the row", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-coverage-request", (e) => seen.push((e as CustomEvent).detail.id));
    btn(el, 2)!.focus();
    btn(el, 2)!.click();
    await settle();
    await wait(50);
    expect(seen).toEqual(["c"]);
    const note = row(el, 2).querySelector<HTMLElement>(".ui-evc__note")!;
    expect(note.dataset.request).toBe("requested");
    expect(plain(note.textContent)).toBe("Requested");
    expect(document.activeElement).toBe(note);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Coverage requested for Field reports.");
  });

  test("with a resolver: Requesting…, then a failure with Retry, then Requested", async () => {
    const el = await make();
    let fail = true;
    let release!: () => void;
    el.requestCoverage = (_s, _signal) =>
      new Promise((res, rej) => {
        release = () => (fail ? rej(new Error("x")) : res(undefined));
      });
    btn(el, 1)!.click();
    await settle();
    expect(row(el, 1).querySelector<HTMLElement>(".ui-evc__note")!.dataset.request).toBe("pending");
    release();
    await wait(10);
    await settle();
    const failed = row(el, 1).querySelector<HTMLElement>(".ui-evc__note")!;
    expect(failed.dataset.request).toBe("failed");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Couldn't request coverage for Filings.");
    fail = false;
    failed.querySelector("button")!.click();
    await settle();
    release();
    await wait(10);
    await settle();
    expect(row(el, 1).querySelector<HTMLElement>(".ui-evc__note")!.dataset.request).toBe("requested");
  });

  test("prevented: nothing changes until the app sets the source's request", async () => {
    const el = await make();
    el.addEventListener("tc-coverage-request", (e) => e.preventDefault());
    btn(el, 1)!.click();
    await settle();
    expect(btn(el, 1)).not.toBeNull();
    el.sources = SOURCES.map((s) => (s.id === "b" ? { ...s, request: "pending" } : s));
    await settle();
    expect(row(el, 1).querySelector<HTMLElement>(".ui-evc__note")!.dataset.request).toBe("pending");
  });

  test("a pending request is aborted when the element leaves the page", async () => {
    const el = await make();
    let signal!: AbortSignal;
    el.requestCoverage = (_s, sig) => {
      signal = sig;
      return new Promise(() => {});
    };
    btn(el, 1)!.click();
    await settle();
    el.remove();
    expect(signal.aborted).toBe(true);
  });

  test("inline: a summary line and a Sources disclosure; tc-open-change is cancelable", async () => {
    const el = await fixture<TcEvidenceCoverage>(html`<tc-evidence-coverage inline .sources=${SOURCES}></tc-evidence-coverage>`);
    expect(el.querySelector(".tc-head")).toBeNull();
    expect(el.querySelector(".ui-evc__list")).toBeNull();
    expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.classList.contains("ui-evc__summary")).toBe(true);
    const toggle = el.querySelector<HTMLButtonElement>(".ui-evc__toggle")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(plain(toggle.textContent)).toBe("Sources 1/3");
    toggle.click();
    await settle();
    expect(el.open).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).toBe(el.querySelector(".ui-evc__list"));
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    toggle.click();
    await settle();
    expect(el.open).toBe(true);
  });

  test("the wrapper: title, onRequestCoverage, and an open value that survives a re-render", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    const render = (n: number) =>
      root.render(
        React.createElement(EvidenceCoverage, { title: `Coverage ${n}`, inline: n > 0, sources: SOURCES, onRequestCoverage: (s) => calls.push(s.id) }),
      );
    await act(async () => render(0));
    await settle();
    const el = host.querySelector("tc-evidence-coverage")!;
    expect(el.querySelector("h3")!.textContent).toBe("Coverage 0");
    btn(el, 2)!.click();
    expect(calls).toEqual(["c"]);
    await act(async () => render(1));
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-evc__toggle")!.click();
    await settle();
    await act(async () => render(2));
    await settle();
    expect(el.open).toBe(true);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10" : ""}>
        <tc-evidence-coverage .sources=${SOURCES}></tc-evidence-coverage>
        <tc-evidence-coverage look="clean" heading="Clean" .sources=${SOURCES.map((s, i) => (i === 2 ? { ...s, request: "failed" as const } : s))}></tc-evidence-coverage>
        <tc-evidence-coverage inline open .sources=${SOURCES.map((s, i) => (i === 1 ? { ...s, request: "requested" as const } : s))}></tc-evidence-coverage>
      </div>`);
      await wait(400);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
