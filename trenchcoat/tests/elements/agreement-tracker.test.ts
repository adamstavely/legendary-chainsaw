/*
 * <tc-agreement-tracker> in real browsers: the host and both looks and layouts, the stats (rate, run, neutral turns
 * neither extending nor breaking a run), the record and its window, the threshold turning it amber, the warning text,
 * "Show the other side" as an event, the polite announcement, labels, the empty state, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/agreement-tracker";
import { agreementStats, type AgreementTurn, type TcAgreementTracker } from "../../src/elements/agreement-tracker";
import { AgreementTracker } from "../../src/elements/react/agreement-tracker";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const T = (id: string, stance: AgreementTurn["stance"], label?: string): AgreementTurn => ({ id, stance, label });
const MIXED = [T("a", "agreed", "Drop-off"), T("b", "pushed-back", "Cutting the form"), T("c", "neutral"), T("d", "agreed")];
const tracker = (turns: AgreementTurn[] = MIXED, look = "standard", layout = "card") =>
  fixture<TcAgreementTracker>(html`<tc-agreement-tracker look=${look} layout=${layout} .turns=${turns}></tc-agreement-tracker>`);

describe("agreementStats", () => {
  test("counts, rate over turns that took a side, and the run at the end", () => {
    expect(agreementStats([])).toEqual({ agreed: 0, pushedBack: 0, neutral: 0, rate: null, run: { stance: null, length: 0, ids: [] } });
    const s = agreementStats(MIXED);
    expect([s.agreed, s.pushedBack, s.neutral, s.rate]).toEqual([2, 1, 1, 2 / 3]);
    expect(s.run).toEqual({ stance: "agreed", length: 1, ids: ["d"] });
  });

  test("neutral turns neither extend nor break a run; a push-back ends it", () => {
    expect(agreementStats([T("a", "agreed"), T("n", "neutral"), T("b", "agreed")]).run).toEqual({ stance: "agreed", length: 2, ids: ["b", "a"] });
    expect(agreementStats([T("a", "agreed"), T("p", "pushed-back"), T("b", "agreed")]).run.length).toBe(1);
    expect(agreementStats([T("p", "pushed-back"), T("q", "pushed-back"), T("n", "neutral")]).run).toEqual({ stance: "pushed-back", length: 2, ids: ["q", "p"] });
    expect(agreementStats([T("n", "neutral")]).run.stance).toBeNull();
  });
});

describe("tc-agreement-tracker", () => {
  for (const look of looks) {
    test(`${look}: the host is a region named by its heading; the rate, the run and the record`, async () => {
      const el = await tracker(MIXED, look);
      expect(el.dataset.ui).toBe("agr");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Agreement");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("This session");
      expect(el.querySelector(".ui-agr__big")!.textContent).toBe("67%");
      expect(plain(el.querySelector(".ui-agr__under")!.textContent)).toBe("agreed · 2 of 3 · 1 neutral");
      expect(el.querySelector(".ui-agr__runval")!.textContent).toBe("1 agreed");
      expect(plain(el.querySelector(".ui-agr__pill")!.textContent)).toBe("4 turns");
      const turns = [...el.querySelectorAll<HTMLElement>(".ui-agr__turn")];
      expect(turns.map((t) => t.dataset.stance)).toEqual(["agreed", "pushed-back", "neutral", "agreed"]);
      expect(turns.map((t) => plain(t.textContent))).toEqual(["Turn 1: Agreed – Drop-off", "Turn 2: Pushed back – Cutting the form", "Turn 3: Neutral", "Turn 4: Agreed"]);
      expect(turns[1].title).toBe("Turn 2 · Pushed back · Cutting the form");
      expect(el.querySelector(".ui-agr__record")!.getAttribute("aria-label")).toBe("Turns, oldest first");
      expect(el.hasAttribute("data-warned")).toBe(false);
      expect(el.querySelector(".ui-agr__warn")).toBeNull();
      // Standard: header and card on the tray; Clean: the header inside the card
      expect(!!el.querySelector(".ui-agr__card > .tc-head")).toBe(look === "clean");
    });
  }

  test("at the threshold it turns amber, marks the run and offers Show the other side", async () => {
    const el = await tracker(MIXED);
    el.turns = [...MIXED, T("e", "neutral"), T("f", "agreed")];
    await settle();
    expect(el.warned).toBe(true);
    expect(el.hasAttribute("data-warned")).toBe(true);
    expect([...el.querySelectorAll<HTMLElement>(".ui-agr__turn[data-run]")].map((t) => plain(t.textContent))).toEqual(["Turn 4: Agreed", "Turn 6: Agreed"]);
    expect(plain(el.querySelector('.ui-agr__pill[data-tone="warning"]')!.textContent)).toBe("2 in a row");
    expect(el.querySelector(".ui-agr__warn-text")!.textContent).toBe("The last 2 answers agreed with you. The strongest case against may show what agreement hides.");
    expect(el.querySelector(".ui-agr__stat[data-warned]")).not.toBeNull();
    // The warning sits on the tray in Standard
    expect(el.querySelector(":scope > .ui-agr__warn")).not.toBeNull();
    // A push-back clears it
    el.turns = [...el.turns, T("g", "pushed-back")];
    await settle();
    expect(el.warned).toBe(false);
    expect(el.querySelector(".ui-agr__warn")).toBeNull();
    expect(el.querySelector(".ui-agr__runval")!.textContent).toBe("1 pushed back");
  });

  test("threshold, warning text, labels and counter label are properties", async () => {
    const el = await tracker([T("a", "agreed"), T("b", "agreed")]);
    expect(el.warned).toBe(true);
    el.threshold = 3;
    await settle();
    expect(el.warned).toBe(false);
    el.threshold = 1;
    el.warningText = "{n} yes in a row";
    el.counterLabel = "Argue against";
    el.stanceLabels = { agreed: "Aligned", "pushed-back": "Challenged" };
    el.heading = "Framing";
    el.scope = "";
    await settle();
    expect(el.querySelector(".ui-agr__warn-text")!.textContent).toBe("2 yes in a row");
    expect(plain(el.querySelector(".ui-agr__warn .ui-agr__counter")!.textContent)).toBe("Argue against");
    expect(el.querySelector(".ui-agr__runval")!.textContent).toBe("2 aligned");
    expect([...el.querySelectorAll(".ui-agr__key-item")].map((k) => k.textContent)).toEqual(["Aligned", "Challenged", "Neutral"]);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Framing");
    expect(el.querySelector(".tc-head__sub")).toBeNull();
  });

  test("Show the other side fires tc-counter-request with the run and its last turn", async () => {
    const el = await tracker([T("a", "pushed-back"), T("b", "agreed"), T("c", "agreed"), T("d", "agreed")]);
    const seen: unknown[] = [];
    el.addEventListener("tc-counter-request", (e) => seen.push((e as CustomEvent).detail));
    el.querySelector<HTMLButtonElement>(".ui-agr__counter")!.click();
    expect(seen).toEqual([{ run: 3, turnId: "d" }]);
  });

  test("crossing the threshold is announced once, politely", async () => {
    const el = await tracker([T("a", "agreed")]);
    const status = () => el.querySelector('[role="status"]')!.textContent;
    expect(status()).toBe("");
    el.turns = [T("a", "agreed"), T("b", "agreed")];
    await settle();
    expect(status()).toBe("2 agreements in a row. Show the other side is available.");
    el.turns = [T("a", "agreed"), T("b", "agreed"), T("c", "agreed")];
    await settle();
    expect(status()).toBe("2 agreements in a row. Show the other side is available.");
    el.turns = [...el.turns, T("d", "pushed-back")];
    await settle();
    expect(status()).toBe("");
  });

  test("the record shows the latest turns and counts the earlier ones", async () => {
    const many = Array.from({ length: 30 }, (_, i) => T(`t${i}`, i % 3 === 0 ? "pushed-back" : "neutral"));
    const el = await tracker(many);
    expect(el.querySelectorAll(".ui-agr__turn").length).toBe(24);
    expect(plain(el.querySelector(".ui-agr__more")!.textContent)).toBe("+6 earlier turns");
    expect(plain(el.querySelector(".ui-agr__turn")!.textContent)).toBe("Turn 7: Pushed back");
    el.max = 5;
    await settle();
    expect(el.querySelectorAll(".ui-agr__turn").length).toBe(5);
    el.layout = "inline";
    el.max = undefined;
    await settle();
    expect(el.querySelectorAll(".ui-agr__turn").length).toBe(8);
  });

  test("inline: one strip, a group named by the heading, the button only when warned", async () => {
    const el = await tracker(MIXED, "standard", "inline");
    expect(el.getAttribute("role")).toBe("group");
    expect(el.getAttribute("aria-label")).toBe("Agreement");
    expect(el.hasAttribute("aria-labelledby")).toBe(false);
    expect(el.querySelector(".tc-head")).toBeNull();
    expect(plain(el.querySelector(".ui-agr__read")!.textContent)).toBe("Agreed 2 of 3 · pushed back 1×");
    expect(el.querySelector(".ui-agr__counter")).toBeNull();
    el.turns = [...MIXED, T("e", "agreed")];
    await settle();
    expect(plain(el.querySelector(".ui-agr__read")!.textContent)).toBe("Agreed 3 of 4 · 2 in a row");
    expect(el.querySelector(".ui-agr__counter--inline")).not.toBeNull();
    el.layout = "card";
    await settle();
    expect(el.getAttribute("role")).toBe("region");
    expect(el.hasAttribute("aria-label")).toBe(false);
  });

  test("empty: no answers yet; no side taken yet", async () => {
    const el = await tracker([]);
    expect(el.querySelector(".ui-agr__big")!.textContent).toBe("–");
    expect(el.querySelector(".ui-agr__runval")!.textContent).toBe("None yet");
    expect(el.querySelector(".ui-agr__empty")!.textContent).toBe("No answers yet – each one is marked here as it arrives.");
    el.layout = "inline";
    await settle();
    expect(plain(el.querySelector(".ui-agr__read")!.textContent)).toBe("No answers yet");
    el.turns = [T("n", "neutral")];
    await settle();
    expect(plain(el.querySelector(".ui-agr__read")!.textContent)).toBe("No answer took a side yet");
  });

  test("the wrapper: title and onRequestCounter", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: unknown[] = [];
    await act(async () => root.render(React.createElement(AgreementTracker, { title: "Framing", turns: [T("a", "agreed"), T("b", "agreed")], onRequestCounter: (d) => calls.push(d) })));
    await settle();
    const el = host.querySelector("tc-agreement-tracker")!;
    expect(el.querySelector("h3")!.textContent).toBe("Framing");
    el.querySelector<HTMLButtonElement>(".ui-agr__counter")!.click();
    expect(calls).toEqual([{ run: 2, turnId: "b" }]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look or layout (${theme})`, async () => {
      const warned = [...MIXED, T("e", "agreed")];
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-agreement-tracker .turns=${warned}></tc-agreement-tracker>
        <tc-agreement-tracker look="clean" heading="Clean" .turns=${warned}></tc-agreement-tracker>
        <tc-agreement-tracker heading="Calm" .turns=${MIXED}></tc-agreement-tracker>
        <tc-agreement-tracker layout="inline" heading="Inline" .turns=${warned}></tc-agreement-tracker>
        <tc-agreement-tracker layout="inline" look="clean" heading="Inline clean" .turns=${MIXED}></tc-agreement-tracker>
        <tc-agreement-tracker heading="Empty"></tc-agreement-tracker>
      </div>`);
      await wait(400);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
