/*
 * <tc-run-manifest> in real browsers: the host and both looks, every field, the shortened hash copied in full, copy
 * (cancelable, the clipboard, "Copied" and its timer), export with the whole record, the footer toolbar's keyboard,
 * Show all sources, the verification summary, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import "../../src/elements/run-manifest";
import type { RunManifestSource, RunVerification, TcRunManifest } from "../../src/elements/run-manifest";
import { RunManifest } from "../../src/elements/react/run-manifest";
import { cleanup, fixture, settle } from "./helpers";

const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const HASH = "sha256:3f9a2c71d0e4b6a85c19f2e7d4a0b3c6e81f5d9a7b2c4e60f1a3d8b5c7e9b81e";
const SOURCES: RunManifestSource[] = [
  { id: "a", label: "Supplier contracts", detail: "1,204 documents" },
  { id: "b", label: "Public filings" },
  { id: "c", label: "Uploaded: audit.pdf" },
  { id: "d", label: "Trade press" },
];
const VERIFY: RunVerification = { verified: 12, unverifiable: 2, incorrect: 1, pending: 5 };
const manifest = (look = "standard", verification: RunVerification = VERIFY) =>
  fixture<TcRunManifest>(html`<tc-run-manifest
    look=${look}
    run-id="run_8f2c41"
    timestamp="Oct 24, 14:02 UTC"
    model="Opus 5.5"
    model-id="claude-opus-5-5"
    instruction-label="Analyst v4"
    instruction-hash=${HASH}
    intent="Which suppliers carry a risk we should act on?"
    .settings=${[
      { label: "Temperature", value: "0.2" },
      { label: "Seed", value: "1187" },
    ]}
    .sources=${SOURCES}
    .verification=${verification}
  ></tc-run-manifest>`);

// The clipboard is stubbed: headless browsers refuse it without a permission prompt
let written: string[] = [];
let original: Clipboard["writeText"] | undefined;
beforeEach(() => {
  written = [];
  original = navigator.clipboard?.writeText;
  if (navigator.clipboard) navigator.clipboard.writeText = async (t: string) => void written.push(t);
});
afterEach(() => {
  if (navigator.clipboard && original) navigator.clipboard.writeText = original;
  cleanup();
});

describe("tc-run-manifest", () => {
  for (const look of looks) {
    test(`${look}: the host is the root and a region named by its heading; every field shows`, async () => {
      const el = await manifest(look);
      expect(el.dataset.ui).toBe("rmf");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Run manifest");
      expect(el.querySelector(".ui-rmf__run")!.textContent).toBe("run_8f2c41");
      expect(plain(el.querySelector(".ui-rmf__sub")!.textContent)).toBe("run_8f2c41·Oct 24, 14:02 UTC");
      expect(plain(el.querySelector(".ui-rmf__model")!.textContent)).toBe("Opus 5.5");
      expect([...el.querySelectorAll(".ui-rmf__key")].map((k) => k.textContent)).toEqual(["Model", "Settings", "Instruction", "Sources", "Intent", "Verification"]);
      expect(el.querySelector(".ui-rmf__code")!.textContent).toBe("claude-opus-5-5");
      expect([...el.querySelectorAll(".ui-rmf__setting")].map((s) => plain(s.textContent))).toEqual(["Temperature 0.2", "Seed 1187"]);
      expect(el.querySelector(".ui-rmf__instruction")!.textContent).toBe("Analyst v4");
      expect(el.querySelector(".ui-rmf__intent")!.textContent).toBe("Which suppliers carry a risk we should act on?");
    });
  }

  test("the hash shows shortened, with its full value as the tooltip", async () => {
    const el = await manifest();
    const hash = el.querySelector(".ui-rmf__hash")!;
    expect(plain(hash.textContent)).toBe("Hash sha256:3f9a2c71…b81e");
    expect(hash.getAttribute("title")).toBe(HASH);
    el.instructionHash = "abc123";
    await settle();
    expect(plain(el.querySelector(".ui-rmf__hash")!.textContent)).toBe("Hash abc123");
    el.instructionHash = "0123456789abcdef0123";
    await settle();
    expect(plain(el.querySelector(".ui-rmf__hash")!.textContent)).toBe("Hash 01234567…0123");
  });

  test("copy: a cancelable tc-copy with the full text, then the clipboard, Copied for a moment and said", async () => {
    const el = await manifest();
    const seen: unknown[] = [];
    el.addEventListener("tc-copy", (e) => seen.push((e as CustomEvent).detail));
    const buttons = el.querySelectorAll<HTMLButtonElement>(".ui-rmf__copy");
    expect([...buttons].map((b) => b.getAttribute("aria-label"))).toEqual(["Copy run id", "Copy model id", "Copy instruction hash"]);
    buttons[2].click();
    await wait(20);
    await settle();
    expect(seen).toEqual([{ field: "instruction", text: HASH }]);
    if (navigator.clipboard) expect(written).toEqual([HASH]);
    expect(el.querySelectorAll(".ui-rmf__copy")[2].hasAttribute("data-done")).toBe(true);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Instruction hash copied.");
    await wait(1700);
    await settle();
    expect(el.querySelectorAll(".ui-rmf__copy")[2].hasAttribute("data-done")).toBe(false);
  });

  test("copy prevented: the app copies, the element only confirms", async () => {
    const el = await manifest();
    el.addEventListener("tc-copy", (e) => e.preventDefault());
    el.querySelectorAll<HTMLButtonElement>(".ui-rmf__copy")[0].click();
    await settle();
    expect(written).toEqual([]);
    expect(el.querySelectorAll(".ui-rmf__copy")[0].hasAttribute("data-done")).toBe(true);
  });

  test("Copy in the footer copies the whole manifest as JSON; Export fires tc-export with the record", async () => {
    const el = await manifest();
    const copies: { field: string; text: string }[] = [];
    const exports: unknown[] = [];
    el.addEventListener("tc-copy", (e) => copies.push((e as CustomEvent).detail));
    el.addEventListener("tc-export", (e) => exports.push((e as CustomEvent).detail.manifest));
    const [copy, exp] = el.querySelectorAll<HTMLButtonElement>(".ui-rmf__tool");
    copy.click();
    await wait(20);
    await settle();
    expect(copies[0].field).toBe("manifest");
    const record = JSON.parse(copies[0].text);
    expect(record).toEqual(el.manifest);
    expect(record.instruction).toEqual({ label: "Analyst v4", hash: HASH });
    expect(record.verification).toEqual({ verified: 12, unverifiable: 2, incorrect: 1, dismissed: 0, pending: 5 });
    expect(plain(el.querySelectorAll(".ui-rmf__tool")[0].textContent)).toBe("Copied");
    exp.click();
    expect(exports).toEqual([el.manifest]);
  });

  test("the footer is a toolbar: one tab stop, arrows, Home and End move between the buttons", async () => {
    const el = await manifest();
    const bar = el.querySelector<HTMLElement>(".ui-rmf__tools")!;
    expect(bar.getAttribute("role")).toBe("toolbar");
    expect(bar.getAttribute("aria-label")).toBe("Manifest actions");
    const tools = [...el.querySelectorAll<HTMLButtonElement>(".ui-rmf__tool")];
    expect(tools.map((t) => t.tabIndex)).toEqual([0, -1]);
    tools[0].focus();
    const key = (k: string) => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    key("ArrowRight");
    expect(document.activeElement).toBe(tools[1]);
    expect(tools.map((t) => t.tabIndex)).toEqual([-1, 0]);
    key("ArrowRight");
    expect(document.activeElement).toBe(tools[0]);
    key("End");
    expect(document.activeElement).toBe(tools[1]);
    key("Home");
    expect(document.activeElement).toBe(tools[0]);
    key("ArrowLeft");
    expect(document.activeElement).toBe(tools[1]);
  });

  test("sources: the first few, and Show all as a disclosure", async () => {
    const el = await manifest();
    expect(el.querySelectorAll(".ui-rmf__source").length).toBe(3);
    expect(el.querySelector(".ui-rmf__source-detail")!.textContent).toBe("1,204 documents");
    const more = el.querySelector<HTMLButtonElement>(".ui-rmf__more")!;
    expect(plain(more.textContent)).toBe("Show all 4");
    expect(more.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(more.getAttribute("aria-controls")!)).toBe(el.querySelector(".ui-rmf__sources"));
    more.click();
    await settle();
    expect(el.querySelectorAll(".ui-rmf__source").length).toBe(4);
    expect(more.getAttribute("aria-expanded")).toBe("true");
    expect(plain(more.textContent)).toBe("Show fewer");
    el.sourceLimit = 5;
    await settle();
    expect(el.querySelector(".ui-rmf__more")).toBeNull();
  });

  test("verification: the summary, a meter of the reviewed claims, segments and counts per state", async () => {
    const el = await manifest();
    expect(el.querySelector(".ui-rmf__verify-summary")!.textContent).toBe("15 of 20 claims reviewed");
    const bar = el.querySelector<HTMLElement>(".ui-rmf__verify-bar")!;
    expect(bar.getAttribute("role")).toBe("meter");
    expect(bar.getAttribute("aria-label")).toBe("Claims reviewed");
    expect(bar.getAttribute("aria-valuemax")).toBe("20");
    expect(bar.getAttribute("aria-valuenow")).toBe("15");
    expect(bar.getAttribute("aria-valuetext")).toBe("15 of 20 claims reviewed: 12 verified, 2 can't verify, 1 incorrect, 5 not reviewed");
    expect([...bar.querySelectorAll<HTMLElement>(".ui-rmf__verify-seg")].map((s) => [s.dataset.state, s.style.width])).toEqual([
      ["verified", "60%"],
      ["unverifiable", "10%"],
      ["incorrect", "5%"],
    ]);
    expect([...el.querySelectorAll(".ui-rmf__verify-legend li")].map((l) => plain(l.textContent))).toEqual(["Verified 12", "Can't verify 2", "Incorrect 1", "Not reviewed 5"]);
    el.verification = { verified: 3, dismissed: 1 };
    el.noun = "findings";
    el.stateLabels = { dismissed: "Set aside" };
    await settle();
    expect(el.querySelector(".ui-rmf__verify-summary")!.textContent).toBe("All 4 findings reviewed");
    expect(el.querySelector(".ui-rmf__verify-summary")!.getAttribute("data-done")).toBe("true");
    expect(plain(el.querySelectorAll(".ui-rmf__verify-legend li")[1].textContent)).toBe("Set aside 1");
    el.verification = {};
    await settle();
    expect(el.querySelector(".ui-rmf__verify-summary")!.textContent).toBe("No findings collected");
    expect(el.querySelector(".ui-rmf__verify-bar")).toBeNull();
  });

  test("empty fields leave their rows out", async () => {
    const el = await fixture<TcRunManifest>(html`<tc-run-manifest model="Opus 5.5"></tc-run-manifest>`);
    expect([...el.querySelectorAll(".ui-rmf__key")].map((k) => k.textContent)).toEqual(["Model", "Verification"]);
    expect(el.querySelector(".ui-rmf__sub")).toBeNull();
    expect(el.querySelectorAll(".ui-rmf__copy").length).toBe(0);
  });

  test("the model icon is cloned in", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.classList.add("logo");
    const el = await fixture<TcRunManifest>(html`<tc-run-manifest model="Opus 5.5" .modelIcon=${icon}></tc-run-manifest>`);
    expect(el.querySelector(".ui-rmf__model-icon .logo")).not.toBe(icon);
    expect(el.querySelector(".ui-rmf__model-icon .logo")).not.toBeNull();
  });

  test("the wrapper: callbacks fire; returning false from onCopy leaves the clipboard alone", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: unknown[] = [];
    await act(async () =>
      root.render(
        React.createElement(RunManifest, {
          title: "Record",
          runId: "run_1",
          instructionHash: HASH,
          onCopy: (field, text) => {
            calls.push(["copy", field, text]);
            return false;
          },
          onExport: (m) => calls.push(["export", m.runId]),
        }),
      ),
    );
    await settle();
    const el = host.querySelector("tc-run-manifest")!;
    expect(el.querySelector("h3")!.textContent).toBe("Record");
    el.querySelectorAll<HTMLButtonElement>(".ui-rmf__copy")[1].click();
    el.querySelectorAll<HTMLButtonElement>(".ui-rmf__tool")[1].click();
    await act(async () => settle());
    expect(calls).toEqual([
      ["copy", "instruction", HASH],
      ["export", "run_1"],
    ]);
    expect(written).toEqual([]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10" : ""}>
        <tc-run-manifest run-id="run_1" timestamp="Oct 24" model="Opus 5.5" model-id="claude-opus-5-5" instruction-hash=${HASH} intent="Find the risks" .settings=${[{ label: "Seed", value: "1" }]} .sources=${SOURCES} .verification=${VERIFY}></tc-run-manifest>
        <tc-run-manifest look="clean" heading="Clean" run-id="run_2" model="Opus 5.5" model-id="claude-opus-5-5" instruction-label="v4" instruction-hash=${HASH} .sources=${SOURCES.slice(0, 2)} .verification=${{ verified: 3, dismissed: 2 }}></tc-run-manifest>
      </div>`);
      await wait(500);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
