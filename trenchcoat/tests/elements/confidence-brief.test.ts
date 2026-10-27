/*
 * <tc-confidence-brief> in real browsers: the host and both looks, every section and when it shows, the confidence
 * level, the uncertainty labels, the track record (dots, or a bar past 40), the provenance reference as an event,
 * Copy as text (cancelable tc-copy, toText()), labels as properties, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/confidence-brief";
import type { TcConfidenceBrief } from "../../src/elements/confidence-brief";
import { ConfidenceBrief } from "../../src/elements/react/confidence-brief";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();

const full = (look = "standard") =>
  fixture<TcConfidenceBrief>(html`<tc-confidence-brief
    look=${look}
    heading="Annual pricing and churn"
    meta="27 Oct · for the leadership meeting"
    question="Will annual-only pricing reduce churn?"
    conclusion="Probably, by 2–4 points over a year."
    confidence="moderate"
    .uncertainty=${["data", "time"]}
    uncertainty-note="Only one comparable change exists."
    basis="Eighteen months of billing data."
    .changers=${["Renewal cancellations", "A cheaper competitor"]}
    .assumptions=${["Sign-ups hold"]}
    .signals=${["Trial conversion"]}
    .record=${{ right: 17, total: 20, note: "Pricing questions since 2024" }}
    provenance-id="PR-0441"
  ></tc-confidence-brief>`);

describe("tc-confidence-brief", () => {
  for (const look of looks) {
    test(`${look}: an article named by its heading, with every section in order`, async () => {
      const el = await full(look);
      expect(el.dataset.ui).toBe("cfb");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("article");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Annual pricing and churn");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("27 Oct · for the leadership meeting");
      expect(plain(el.querySelector(".ui-cfb__question")!.textContent)).toBe("Asked “Will annual-only pricing reduce churn?”");
      expect(el.querySelector(".ui-cfb__conclusion")!.textContent).toBe("Probably, by 2–4 points over a year.");
      expect(plain(el.querySelector(".ui-cfb__level")!.textContent)).toBe("Moderate confidence");
      expect(el.querySelectorAll(".ui-cfb__bar[data-on]").length).toBe(2);
      expect([...el.querySelectorAll(".ui-cfb__sec .ui-cfb__label, .ui-cfb__lead .ui-cfb__label")].map((h) => h.textContent)).toEqual([
        "Conclusion",
        "Kind of uncertainty",
        "What it rests on",
        "What would change it",
        "Key assumptions",
        "Signs to watch",
        "Track record",
      ]);
      // Each section is named by its label
      for (const sec of el.querySelectorAll("section")) expect(document.getElementById(sec.getAttribute("aria-labelledby")!)).not.toBeNull();
      expect([...el.querySelectorAll(".ui-cfb__kind")].map((k) => plain(k.textContent))).toEqual(["Data – the evidence is thin or incomplete", "Time – the situation is still changing"]);
      expect([...el.querySelectorAll('[data-sec="change"] li')].map((l) => l.textContent)).toEqual(["Renewal cancellations", "A cheaper competitor"]);
      // Standard: header and reference on the tray; Clean: both inside the card
      expect(!!el.querySelector(".ui-cfb__card > .tc-head")).toBe(look === "clean");
      expect(!!el.querySelector(".ui-cfb__card > .ui-cfb__foot")).toBe(look === "clean");
    });
  }

  test("the track record: the score and one dot per question; a bar past 40", async () => {
    const el = await full();
    expect(plain(el.querySelector(".ui-cfb__record")!.textContent)).toBe("17 of 20 Right 17 of 20 on similar questions");
    expect(el.querySelectorAll(".ui-cfb__dot").length).toBe(20);
    expect(el.querySelectorAll(".ui-cfb__dot[data-right]").length).toBe(17);
    expect(el.querySelector(".ui-cfb__note")!.textContent).toBe("Pricing questions since 2024");
    el.record = { right: 90, total: 120 };
    await settle();
    expect(el.querySelectorAll(".ui-cfb__dot").length).toBe(0);
    expect(el.querySelector<HTMLElement>(".ui-cfb__fill")!.style.inlineSize).toBe("75%");
    // Out of range numbers are clamped
    el.record = { right: 30, total: 10 };
    await settle();
    expect(el.querySelectorAll(".ui-cfb__dot[data-right]").length).toBe(10);
  });

  test("sections without content don't show; an empty brief says so", async () => {
    const el = await fixture<TcConfidenceBrief>(html`<tc-confidence-brief></tc-confidence-brief>`);
    expect(el.querySelector(".ui-cfb__conclusion")!.textContent).toBe("No conclusion yet");
    expect(el.querySelectorAll(".ui-cfb__sec").length).toBe(0);
    expect(el.querySelector(".ui-cfb__level")).toBeNull();
    expect(el.querySelector(".ui-cfb__foot")).toBeNull();
    expect(el.querySelector(".ui-cfb__question")).toBeNull();
    el.uncertaintyNote = "Sources disagree.";
    await settle();
    expect(el.querySelector('[data-sec="kind"]')).not.toBeNull();
    expect(el.querySelector(".ui-cfb__kinds")).toBeNull();
  });

  test("the provenance reference fires tc-provenance-open with its id", async () => {
    const el = await full();
    const seen: unknown[] = [];
    el.addEventListener("tc-provenance-open", (e) => seen.push((e as CustomEvent).detail));
    const ref = el.querySelector<HTMLButtonElement>(".ui-cfb__ref")!;
    expect(plain(ref.textContent)).toBe("Provenance record PR-0441");
    ref.click();
    expect(seen).toEqual([{ id: "PR-0441" }]);
  });

  test("toText() is the whole brief as plain text", async () => {
    const el = await full();
    expect(el.toText()).toBe(
      [
        "Annual pricing and churn",
        "27 Oct · for the leadership meeting",
        "",
        "Asked: Will annual-only pricing reduce churn?",
        "",
        "Conclusion (Moderate confidence)",
        "Probably, by 2–4 points over a year.",
        "",
        "Kind of uncertainty: Data, Time",
        "Only one comparable change exists.",
        "",
        "What it rests on",
        "Eighteen months of billing data.",
        "",
        "What would change it",
        "- Renewal cancellations",
        "- A cheaper competitor",
        "",
        "Key assumptions",
        "- Sign-ups hold",
        "",
        "Signs to watch",
        "- Trial conversion",
        "",
        "Track record: right 17 of 20 on similar questions – Pricing questions since 2024",
        "",
        "Provenance record: PR-0441",
      ].join("\n"),
    );
  });

  test("Copy as text: a cancelable tc-copy with the text; prevented, nothing is copied", async () => {
    const el = await full();
    const seen: string[] = [];
    el.addEventListener("tc-copy", (e) => {
      seen.push((e as CustomEvent).detail.text);
      e.preventDefault();
    });
    const btn = el.querySelector<HTMLButtonElement>(".ui-cfb__copy")!;
    expect(plain(btn.textContent)).toBe("Copy as text");
    btn.click();
    await settle();
    expect(seen).toEqual([el.toText()]);
    expect(btn.hasAttribute("data-copied")).toBe(false);
    el.noCopy = true;
    await settle();
    expect(el.querySelector(".ui-cfb__copy")).toBeNull();
  });

  test("Copy as text copies and says so", async () => {
    const el = await full();
    let copied = "";
    // The clipboard needs permission in a test browser: stand in for it
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (t: string) => void (copied = t) } });
    el.querySelector<HTMLButtonElement>(".ui-cfb__copy")!.click();
    await wait(50);
    await settle();
    expect(copied).toBe(el.toText());
    expect(plain(el.querySelector(".ui-cfb__copy")!.textContent)).toBe("Copied");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Brief copied as text");
  });

  test("labels are properties", async () => {
    const el = await full();
    el.confidenceLabels = { moderate: "Medium" };
    el.uncertaintyLabels = { data: "Evidence" };
    el.provenanceLabel = "Audit trail";
    el.copyLabel = "Copy";
    el.confidence = "low";
    await settle();
    expect(plain(el.querySelector(".ui-cfb__level")!.textContent)).toBe("Low confidence");
    el.confidence = "moderate";
    await settle();
    expect(plain(el.querySelector(".ui-cfb__level")!.textContent)).toBe("Medium");
    expect(plain(el.querySelector(".ui-cfb__kind")!.textContent)).toBe("Evidence – the evidence is thin or incomplete");
    expect(el.querySelector(".ui-cfb__ref-label")!.textContent).toBe("Audit trail");
    expect(plain(el.querySelector(".ui-cfb__copy")!.textContent)).toBe("Copy");
    expect(el.toText()).toContain("Kind of uncertainty: Evidence, Time");
  });

  test("the wrapper: title, onOpenProvenance and onCopy", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: unknown[] = [];
    await act(async () =>
      root.render(
        React.createElement(ConfidenceBrief, {
          title: "Restock timing",
          conclusion: "Unlikely before the sale.",
          provenanceId: "PR-9",
          onOpenProvenance: (id) => calls.push(["open", id]),
          onCopy: (text, e) => {
            e.preventDefault();
            calls.push(["copy", text.split("\n")[0]]);
          },
        }),
      ),
    );
    await settle();
    const el = host.querySelector("tc-confidence-brief")!;
    expect(el.querySelector("h3")!.textContent).toBe("Restock timing");
    el.querySelector<HTMLButtonElement>(".ui-cfb__ref")!.click();
    el.querySelector<HTMLButtonElement>(".ui-cfb__copy")!.click();
    expect(calls).toEqual([
      ["open", "PR-9"],
      ["copy", "Restock timing"],
    ]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-confidence-brief heading="Standard" conclusion="Yes." confidence="low" .uncertainty=${["data", "model", "disagreement", "time"]} uncertainty-note="Thin data." .changers=${["A"]} .assumptions=${["B"]} .signals=${["C"]} .record=${{ right: 6, total: 11 }} provenance-id="PR-1"></tc-confidence-brief>
        <tc-confidence-brief look="clean" heading="Clean" question="Why?" conclusion="Because." confidence="high" .record=${{ right: 90, total: 100 }} provenance-id="PR-2"></tc-confidence-brief>
        <tc-confidence-brief heading="Empty"></tc-confidence-brief>
      </div>`);
      await wait(300);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
