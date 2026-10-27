/*
 * <tc-knowledge-promotion> in real browsers: the host and both looks, the fact and its disputed versions side by side,
 * the checklist (required, recommended, the confidence condition from the threshold) with who and when, Promote held
 * back until the required conditions are met and the warning for recommended ones, tc-promote (and controlled use,
 * promoting, errors and retry), the dispute form (validation, Escape, Ctrl+Enter, tc-dispute and controlled use, focus),
 * the React wrapper and axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/knowledge-promotion";
import type { KnowledgeCondition, KnowledgeFact, KnowledgeVersion, TcKnowledgePromotion } from "../../src/elements/knowledge-promotion";
import { KnowledgePromotion } from "../../src/elements/react/knowledge-promotion";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const FACT: KnowledgeFact = { text: "The notice period in the master agreement is 30 days.", by: "Ana Ruiz", at: "12 Oct", source: "Session 14", confidence: 0.86 };
const met = (id: string, label: string, extra: Partial<KnowledgeCondition> = {}): KnowledgeCondition => ({ id, label, met: true, by: "Priya Shah", at: "13 Oct", ...extra });
const ALL_MET: KnowledgeCondition[] = [met("signoff", "Reviewer sign-off"), met("dispute", "No open dispute", { by: undefined, at: undefined, detail: "Checked 13 Oct" }), met("second", "Second reviewer", { required: false, by: "Tom Lee" })];
const OPEN: KnowledgeCondition[] = [
  { id: "signoff", label: "Reviewer sign-off", met: false, detail: "Requested from Priya Shah" },
  met("dispute", "No open dispute", { by: undefined, at: undefined }),
  { id: "second", label: "Second reviewer", met: false, required: false },
];
const VERSIONS: KnowledgeVersion[] = [{ id: "v2", text: "The notice period is 30 business days.", by: "Sam Okafor", at: "14 Oct", note: "Clause 9.2 says business days." }];
const card = (o: { look?: string; conditions?: KnowledgeCondition[]; versions?: KnowledgeVersion[]; fact?: KnowledgeFact } = {}) =>
  fixture<TcKnowledgePromotion>(
    html`<tc-knowledge-promotion look=${o.look ?? "standard"} scope="Acme lease review" .fact=${o.fact ?? FACT} .conditions=${o.conditions ?? OPEN} .versions=${o.versions ?? []}></tc-knowledge-promotion>`,
  );
const promoteBtn = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-kpro__promote");

describe("tc-knowledge-promotion", () => {
  for (const look of looks) {
    test(`${look}: the host is the root and a region named by its heading`, async () => {
      const el = await card({ look });
      expect(el.dataset.ui).toBe("kpro");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Promote to team knowledge");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Acme lease review");
      expect(!!el.querySelector(".ui-kpro__card .tc-head")).toBe(look === "clean");
      expect(!!el.querySelector(".ui-kpro__card .ui-kpro__foot")).toBe(look === "clean");
      expect(el.querySelector(".ui-kpro__pill")!.textContent).toBe("2 of 3 required");
    });
  }

  test("the fact leads: quoted, with who proposed it, when, where and its confidence", async () => {
    const el = await card();
    expect(el.querySelector(".ui-kpro__text")!.textContent).toBe(FACT.text);
    expect(el.querySelector(".ui-kpro__vlabel")!.textContent).toBe("The fact");
    expect(el.querySelector(".ui-kpro__meta")!.textContent).toBe("Proposed by Ana Ruiz · 12 Oct · Session 14");
    expect(el.querySelector(".ui-kpro__conf")!.textContent).toBe("Confidence 0.86");
    expect(el.querySelector(".ui-kpro__versions")).toBeNull();
    el.fact = { text: "" };
    await settle();
    expect(el.querySelector(".ui-kpro__text")!.textContent).toBe("No fact given");
    expect(el.querySelector(".ui-kpro__meta")).toBeNull();
    expect(el.querySelector(".ui-kpro__conf")).toBeNull();
  });

  test("disputed versions stay visible side by side, as a named list", async () => {
    const el = await card({ versions: VERSIONS });
    expect(el.querySelector(".ui-kpro__pill")!.textContent).toBe("Disputed");
    const list = el.querySelector<HTMLElement>(".ui-kpro__versions")!;
    expect(list.getAttribute("role")).toBe("list");
    expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Disputed – both versions stay visible until it's resolved");
    const items = list.querySelectorAll('[role="listitem"]');
    expect(items.length).toBe(2);
    expect(plain(items[0].querySelector(".ui-kpro__vlabel")!.textContent)).toBe("This version");
    expect(plain(items[1].querySelector(".ui-kpro__vhead")!.textContent)).toBe("Disputed by Sam Okafor 14 Oct");
    expect(items[1].querySelector(".ui-kpro__text")!.textContent).toBe("The notice period is 30 business days.");
    expect(items[1].querySelector(".ui-kpro__meta")!.textContent).toBe("Clause 9.2 says business days.");
    el.versions = [...VERSIONS, { id: "v3", text: "60 days" }];
    await settle();
    expect(el.querySelector(".ui-kpro__disputed")!.textContent).toBe("2 disputed versions – all stay visible until it's resolved");
    expect(el.querySelector('[data-id="v3"] .ui-kpro__vlabel')!.textContent).toBe("Disputed version");
  });

  test("the checklist: required and recommended, met or not, with who and when; the confidence condition", async () => {
    const el = await card();
    const rows = [...el.querySelectorAll<HTMLElement>(".ui-kpro__check")];
    expect(rows.map((r) => r.dataset.id)).toEqual(["signoff", "dispute", "second", "confidence"]);
    expect(rows.map((r) => r.dataset.state)).toEqual(["open", "met", "warn", "met"]);
    expect(rows.map((r) => r.querySelector(".ui-kpro__kind")!.textContent)).toEqual(["Required", "Required", "Recommended", "Required"]);
    expect(plain(rows[0].querySelector(".ui-kpro__check-label")!.textContent)).toBe("Reviewer sign-off: Not met");
    expect(rows[0].querySelector(".ui-kpro__check-meta")!.textContent).toBe("Requested from Priya Shah");
    expect(plain(rows[1].querySelector(".ui-kpro__check-label")!.textContent)).toBe("No open dispute: Met");
    expect(rows[1].querySelector(".ui-kpro__check-meta")).toBeNull();
    expect(plain(rows[2].querySelector(".ui-kpro__check-label")!.textContent)).toBe("Second reviewer: Not met – recommended");
    expect(plain(rows[3].querySelector(".ui-kpro__check-label")!.textContent)).toBe("Confidence at or above 0.80: Met");
    expect(rows[3].querySelector(".ui-kpro__check-meta")!.textContent).toBe("Currently 0.86");
    expect(el.querySelector(".ui-kpro__count")!.textContent).toBe("2 of 3 required met");
    expect(document.getElementById(el.querySelector(".ui-kpro__checks")!.getAttribute("aria-labelledby")!)!.textContent).toBe("Before it's promoted");
    // Met with who and when
    el.conditions = ALL_MET;
    await settle();
    expect(el.querySelector('[data-id="signoff"] .ui-kpro__check-meta')!.textContent).toBe("Priya Shah · 13 Oct");
    expect(el.querySelector('[data-id="dispute"] .ui-kpro__check-meta')!.textContent).toBe("Checked 13 Oct");
    // The threshold: below it the condition is open; optional makes it recommended
    el.threshold = 0.9;
    await settle();
    expect(el.querySelector<HTMLElement>('[data-id="confidence"]')!.dataset.state).toBe("open");
    expect(el.ready).toBe(false);
    el.thresholdOptional = true;
    await settle();
    expect(el.querySelector<HTMLElement>('[data-id="confidence"]')!.dataset.state).toBe("warn");
    expect(el.ready).toBe(true);
    el.fact = { text: "No confidence" };
    await settle();
    expect(el.querySelector('[data-id="confidence"]')).toBeNull();
  });

  test("Promote is unavailable until the required conditions are met, and says what it waits on", async () => {
    const el = await card();
    const btn = promoteBtn(el)!;
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    expect(btn.disabled).toBe(false);
    const status = document.getElementById(btn.getAttribute("aria-describedby")!.split(" ")[0])!;
    expect(status.textContent).toBe("Waiting on: reviewer sign-off");
    const seen: unknown[] = [];
    el.addEventListener("tc-promote", (e) => seen.push((e as CustomEvent).detail));
    btn.click();
    await settle();
    expect(seen).toEqual([]);
    expect(el.status).toBe("candidate");
    el.conditions = [OPEN[0], { ...OPEN[1], met: false }, OPEN[2]];
    await settle();
    expect(el.querySelector(".ui-kpro__status")!.textContent).toBe("Waiting on: reviewer sign-off and no open dispute");
    expect(el.querySelector(".ui-kpro__warning")).toBeNull();
  });

  test("ready with a recommended condition unmet: a warning, and Promote fires a cancelable tc-promote", async () => {
    const el = await card({ conditions: [met("signoff", "Reviewer sign-off"), met("dispute", "No open dispute"), OPEN[2]] });
    expect(el.querySelector(".ui-kpro__pill")!.textContent).toBe("Ready");
    expect(el.querySelector(".ui-kpro__status")!.textContent).toBe("Ready to promote");
    const warning = el.querySelector(".ui-kpro__warning")!;
    expect(plain(warning.textContent)).toBe("Second reviewer is recommended and not met. You can still promote it.");
    const btn = promoteBtn(el)!;
    expect(btn.getAttribute("aria-disabled")).toBe("false");
    expect(btn.getAttribute("aria-describedby")!.split(" ")).toContain(warning.id);
    const seen: unknown[] = [];
    el.addEventListener("tc-promote", (e) => seen.push((e as CustomEvent).detail));
    btn.click();
    await settle();
    expect(seen).toEqual([{ fact: FACT, unmetRecommended: ["second"] }]);
    expect(el.status).toBe("promoted");
    expect(el.getAttribute("status")).toBe("promoted");
    expect(el.querySelector(".ui-kpro__pill")!.textContent).toBe("Promoted");
    expect(el.querySelector(".ui-kpro__status")!.textContent).toBe("In team knowledge");
    expect(promoteBtn(el)).toBeNull();
    expect(el.querySelector(".ui-kpro__warning")).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Promoted to team knowledge.");
    // Dispute is still offered after promotion
    expect(el.querySelector(".ui-kpro__dispute")).not.toBeNull();
  });

  test("controlled: preventDefault keeps the status; promoting, then an error and a retry", async () => {
    const el = await card({ conditions: ALL_MET });
    let calls = 0;
    el.addEventListener("tc-promote", (e) => {
      calls++;
      e.preventDefault();
    });
    promoteBtn(el)!.click();
    await settle();
    expect(el.status).toBe("candidate");
    el.status = "promoting";
    await settle();
    expect(promoteBtn(el)!.getAttribute("aria-busy")).toBe("true");
    expect(promoteBtn(el)!.getAttribute("aria-disabled")).toBe("true");
    expect(el.querySelector(".ui-kpro__status")!.textContent).toBe("Promoting…");
    promoteBtn(el)!.click();
    expect(calls).toBe(1);
    el.status = "candidate";
    el.error = "The knowledge base didn't respond.";
    await settle();
    expect(el.querySelector('[role="alert"]')!.textContent).toBe("The knowledge base didn't respond.");
    expect(promoteBtn(el)!.textContent!.trim()).toBe("Try again");
    promoteBtn(el)!.click();
    expect(calls).toBe(2);
    el.status = "promoted";
    await settle();
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Promoted to team knowledge.");
  });

  test("the dispute form: opens with focus in it, needs a reason, Escape cancels, Ctrl+Enter sends", async () => {
    const el = await card();
    const dispute = el.querySelector<HTMLButtonElement>(".ui-kpro__dispute")!;
    expect(dispute.getAttribute("aria-expanded")).toBe("false");
    dispute.click();
    await settle();
    expect(el.disputing).toBe(true);
    expect(dispute.getAttribute("aria-expanded")).toBe("true");
    const form = el.querySelector<HTMLFormElement>(".ui-kpro__form")!;
    expect(form.getAttribute("aria-label")).toBe("Dispute this fact");
    const reason = el.querySelector<HTMLTextAreaElement>(".ui-kpro__reason")!;
    expect(document.activeElement).toBe(reason);
    expect(el.querySelector(`label[for="${reason.id}"]`)!.textContent).toBe("What's wrong with it?");
    // Sent empty: invalid, an error tied to the field, focus back in it
    const sent: unknown[] = [];
    el.addEventListener("tc-dispute", (e) => sent.push((e as CustomEvent).detail));
    el.querySelector<HTMLButtonElement>('.ui-kpro__form button[type="submit"]')!.click();
    await settle();
    expect(sent).toEqual([]);
    expect(reason.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(reason.getAttribute("aria-describedby")!)!.textContent).toBe("Say what's wrong with it, so the reviewer can check.");
    expect(document.activeElement).toBe(reason);
    reason.value = "Clause 9.2 says business days";
    reason.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(reason.getAttribute("aria-invalid")).toBe("false");
    // Escape cancels and clears; focus returns to Dispute
    reason.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await settle();
    expect(el.querySelector(".ui-kpro__form")).toBeNull();
    expect(document.activeElement).toBe(dispute);
    dispute.click();
    await settle();
    expect(el.querySelector<HTMLTextAreaElement>(".ui-kpro__reason")!.value).toBe("");
    const r2 = el.querySelector<HTMLTextAreaElement>(".ui-kpro__reason")!;
    r2.value = "  Business days, not calendar days  ";
    r2.dispatchEvent(new Event("input", { bubbles: true }));
    const fields = el.querySelectorAll<HTMLTextAreaElement>(".ui-kpro__field");
    fields[1].value = "30 business days";
    fields[1].dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    r2.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true, cancelable: true }));
    await settle();
    expect(sent).toEqual([{ reason: "Business days, not calendar days", version: "30 business days" }]);
    expect(el.disputing).toBe(false);
    expect(document.activeElement).toBe(dispute);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Dispute raised.");
  });

  test("controlled dispute: preventDefault keeps the form open until the app closes it", async () => {
    const el = await card();
    el.addEventListener("tc-dispute", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-kpro__dispute")!.click();
    await settle();
    const reason = el.querySelector<HTMLTextAreaElement>(".ui-kpro__reason")!;
    reason.value = "Wrong";
    reason.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    el.querySelector<HTMLFormElement>(".ui-kpro__form")!.requestSubmit();
    await settle();
    expect(el.disputing).toBe(true);
    expect(el.querySelector(".ui-kpro__form")).not.toBeNull();
    el.disputing = false;
    await settle();
    expect(el.querySelector(".ui-kpro__form")).toBeNull();
    // Hidden for people who can't dispute
    el.noDispute = true;
    await settle();
    expect(el.querySelector(".ui-kpro__dispute")).toBeNull();
  });

  test("the wrapper: uncontrolled status survives a parent re-render; controlled only reports; callbacks", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: unknown[] = [];
    let rerender!: (n: number) => void;
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(KnowledgePromotion, {
        title: `Promote ${n}`,
        fact: FACT,
        conditions: ALL_MET,
        onPromote: (fact, unmet) => calls.push(["promote", fact.text, unmet]),
        onDispute: (reason, version) => calls.push(["dispute", reason, version]),
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-knowledge-promotion")!;
    expect(el.noDispute).toBe(false);
    promoteBtn(el)!.click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(el.querySelector("h3")!.textContent).toBe("Promote 1");
    expect(el.status).toBe("promoted");
    expect(calls).toEqual([["promote", FACT.text, []]]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(KnowledgePromotion, { fact: FACT, conditions: ALL_MET, status: "candidate", onPromote: () => calls.push("controlled") })));
    await settle();
    const el2 = host2.querySelector("tc-knowledge-promotion")!;
    expect(el2.noDispute).toBe(true);
    promoteBtn(el2)!.click();
    await act(async () => settle());
    expect(el2.status).toBe("candidate");
    expect(calls.at(-1)).toBe("controlled");
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10" : ""}>
        <tc-knowledge-promotion scope="Waiting" .fact=${FACT} .conditions=${OPEN}></tc-knowledge-promotion>
        <tc-knowledge-promotion heading="Disputed" disputing .fact=${FACT} .conditions=${OPEN} .versions=${VERSIONS}></tc-knowledge-promotion>
        <tc-knowledge-promotion look="clean" heading="Ready" .fact=${FACT} .conditions=${[ALL_MET[0], ALL_MET[1], OPEN[2]]}></tc-knowledge-promotion>
        <tc-knowledge-promotion look="clean" heading="Promoted" status="promoted" .fact=${FACT} .conditions=${ALL_MET} .versions=${VERSIONS}></tc-knowledge-promotion>
        <tc-knowledge-promotion look="clean" heading="Error" error="Didn't save." disputing .fact=${FACT} .conditions=${ALL_MET}></tc-knowledge-promotion>
      </div>`);
      await wait(500);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
