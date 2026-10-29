/*
 * <tc-configuration-release-control> in real browsers: the pipeline, the candidate's evidence, the gate on Promote,
 * the confirmations (focus in, trapped, restored), tc-promote / tc-rollback / tc-compare, "Requested" until new stages
 * arrive, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/configuration-release-control";
import type {
  ReleaseApproval,
  ReleaseCompareEvent,
  ReleaseEvidence,
  ReleaseFinding,
  ReleaseFindingOpenEvent,
  ReleasePromoteEvent,
  ReleaseRollbackEvent,
  ReleaseStage,
  ReleaseSuite,
  ReleaseVersion,
  ReleaseWaiver,
  TcConfigurationReleaseControl,
} from "../../src/elements/configuration-release-control";
import { ConfigurationReleaseControl } from "../../src/elements/react/configuration-release-control";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const VERSIONS: ReleaseVersion[] = [
  { id: "v12", label: "v12", title: "Original" },
  { id: "v13", label: "v13", title: "Grounded answers" },
  { id: "v14", label: "v14", title: "Shorter answers" },
];
const STAGES: ReleaseStage[] = [
  { id: "draft", label: "Draft", version: "v14" },
  { id: "staging", label: "Staging", version: "v14" },
  { id: "production", label: "Production", version: "v13" },
];
const PASSING: ReleaseEvidence = { passRate: 93.8, baseline: 91.2, threshold: 92, cases: 412 };
const APPROVED: ReleaseApproval[] = [
  { id: "p", name: "Priya Shah", state: "approved", detail: "Support lead" },
  { id: "s", name: "Sam Ortiz", state: "approved" },
];
const CHANGES = [
  { id: "instructions", label: "Instructions", count: 3 },
  { id: "model", label: "Model", count: 0 },
  { id: "tools", label: "Tools", count: 1, detail: "Added order lookup" },
];

type Opts = { look?: "standard" | "clean"; evidence?: ReleaseEvidence; approvals?: ReleaseApproval[]; stages?: ReleaseStage[]; required?: number };
const make = (o: Opts = {}) =>
  fixture<TcConfigurationReleaseControl>(html`<tc-configuration-release-control
    look=${o.look ?? "standard"}
    candidate="v14"
    required-approvals=${o.required ?? 2}
    .stages=${o.stages ?? STAGES}
    .versions=${VERSIONS}
    .changes=${CHANGES}
    .evidence=${o.evidence ?? PASSING}
    .approvals=${o.approvals ?? APPROVED}
    .rollback=${{ stage: "production", version: "v12" }}
  ></tc-configuration-release-control>`);
const promote = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-rls__promote")!;
const rollbackBtn = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-rls__rollback-btn")!;
const dialog = (el: Element) => el.querySelector<HTMLDialogElement>(".ui-rls__dialog")!;
const title = (el: Element) => document.getElementById(dialog(el).getAttribute("aria-labelledby")!)?.textContent?.trim();
const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, " ").trim();
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const finish = async (root: Element) => {
  for (const a of root.getAnimations?.({ subtree: true }) ?? []) a.finish();
  await settle();
};

describe("tc-configuration-release-control", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host, the pipeline and the candidate`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("rls");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Configuration release");
      expect(el.querySelector(".ui-rls__card")).toBeTruthy();
      // The header sits before the card: on the tray in Standard, the host card's first row in Clean
      expect(el.querySelector(".tc-head + .ui-rls__card")).toBeTruthy();
      const stages = [...el.querySelectorAll<HTMLElement>(".ui-rls__stage")];
      expect(el.querySelector(".ui-rls__stages")!.tagName).toBe("OL");
      expect(stages.map((s) => s.querySelector(".ui-rls__stage-name")!.textContent)).toEqual(["Draft", "Staging", "Production"]);
      expect(stages.map((s) => s.dataset.role)).toEqual(["candidate", "candidate", "target"]);
      expect(stages[2].querySelector(".ui-rls__tag")!.textContent).toBe("Next");
      expect(text(stages[2].querySelector(".ui-rls__stage-version"))).toBe("v13 Grounded answers");
      // The gate sits in the pipeline, on the edge into the target stage
      const gate = el.querySelector<HTMLElement>(".ui-rls__gate")!;
      expect(gate.nextElementSibling).toBe(stages[2]);
      expect(document.getElementById(gate.getAttribute("aria-labelledby")!)!.textContent).toBe("Gate to Production");
      expect([...gate.querySelectorAll(".ui-rls__check")].map((c) => text(c))).toEqual(["Evaluation, met: 93.8% · needs 92%", "Approvals, met: 2 of 2 approvals"]);
      expect(text(promote(el))).toBe("Promote v14");
      expect(gate.dataset.state).toBe("ready");
      expect(text(el.querySelector(".ui-rls__cand-line"))).toBe("v14 Shorter answers against v13 in Production");
      expect(el.querySelector(".ui-rls__pill")!.textContent).toBe("Ready to promote");
    });
  }

  test("what changed, the evidence against production, approvals, rollout and the rollback target", async () => {
    const el = await make();
    const changes = [...el.querySelectorAll(".ui-rls__change")];
    expect(changes.map((c) => text(c))).toEqual(["Instructions 3 changes", "Model – no changes", "Tools 1 change Added order lookup"]);
    expect(changes[1].hasAttribute("data-none")).toBe(true);
    const evidence = el.querySelector('[data-block="evidence"]')!;
    expect(text(evidence.querySelector(".ui-rls__label"))).toBe("Evaluation – met");
    expect(text(evidence.querySelector(".ui-rls__score"))).toBe("93.8% pass rate on 412 cases");
    expect(text(evidence.querySelector(".ui-rls__fine"))).toBe("Threshold 92% · met +2.6 pts vs v13 (91.2%)");
    expect(evidence.querySelector<HTMLElement>(".ui-rls__threshold")!.style.left).toBe("92%");
    const approvals = el.querySelector('[data-block="approvals"]')!;
    expect(text(approvals.querySelector(".ui-rls__fine"))).toBe("2 of 2 approvals in");
    expect([...approvals.querySelectorAll(".ui-rls__person")].map((p) => text(p))).toEqual(["PS Priya Shah Support lead Approved", "SO Sam Ortiz Approved"]);
    expect(text(el.querySelector(".ui-rls__rb-what"))).toBe("v12 Original in Production");
    expect(rollbackBtn(el).getAttribute("aria-label")).toBe("Roll back Production to v12");
    expect(text(el.querySelector(".ui-rls__compare"))).toBe("Compare v13 → v14");
  });

  test("Promote is gated: no evaluation, a running one, a low pass rate, missing or refused approvals, a hold", async () => {
    const el = await make({ evidence: undefined, approvals: [APPROVED[0]] });
    el.evidence = undefined;
    await settle();
    const btn = promote(el);
    const gate = () => text(document.getElementById(btn.getAttribute("aria-describedby")!));
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    expect(el.querySelector(".ui-rls__pill")!.textContent).toBe("Not ready");
    expect(gate()).toBe("To promote: no evaluation yet; 1 of 2 approvals.");
    expect(text(el.querySelector('[data-block="evidence"] .ui-rls__quiet'))).toBe("No evaluation has run on this version.");
    el.evidence = { state: "running", threshold: 92, suite: "refund suite" };
    await settle();
    expect(gate()).toBe("To promote: evaluation still running; 1 of 2 approvals.");
    expect(text(el.querySelector('[data-block="evidence"] .ui-rls__quiet'))).toBe("Running refund suite…");
    el.evidence = { passRate: 88, baseline: 91, threshold: 92 };
    el.approvals = [APPROVED[0], { id: "s", name: "Sam Ortiz", state: "rejected" }];
    await settle();
    expect(gate()).toBe("To promote: pass rate 88% is under the 92% threshold; Sam Ortiz asked for changes.");
    expect([...el.querySelectorAll(".ui-rls__check-value")].map((c) => c.textContent)).toEqual(["88% · needs 92%", "Changes requested"]);
    expect(text(el.querySelector('[data-block="evidence"] .ui-rls__label'))).toBe("Evaluation – not met");
    expect(el.querySelector('[data-block="evidence"] .ui-rls__delta')!.getAttribute("data-dir")).toBe("down");
    // Pressing it says why, and opens nothing
    btn.click();
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Can't promote yet: pass rate 88% is under the 92% threshold; Sam Ortiz asked for changes.");
    el.evidence = PASSING;
    el.approvals = APPROVED;
    el.hold = "Releases are frozen until Monday";
    await settle();
    expect(gate()).toBe("Releases are frozen until Monday.");
    el.approvals = [APPROVED[0]];
    await settle();
    expect(gate()).toBe("Releases are frozen until Monday. To promote: 1 of 2 approvals.");
    el.approvals = APPROVED;
    el.hold = "";
    await settle();
    expect(btn.getAttribute("aria-disabled")).toBe("false");
    expect(gate()).toBe("Evidence and approvals are in. v14 can go to Production.");
  });

  test("Promote asks first: the dialog names the move, focus starts on Cancel and is trapped; Escape restores focus", async () => {
    const el = await make();
    let fired = 0;
    el.addEventListener("tc-promote", () => fired++);
    promote(el).focus();
    promote(el).click();
    await settle();
    const d = dialog(el);
    expect(d.open).toBe(true);
    expect(d.getAttribute("role")).toBe("alertdialog");
    expect(title(el)).toBe("Promote v14 to Production?");
    const desc = document.getElementById(d.getAttribute("aria-describedby")!)!;
    expect(text(desc.querySelector(".ui-rls__dlg-lead"))).toBe("Production moves from v13 to v14.");
    expect([...desc.querySelectorAll(".ui-rls__facts > div")].map((r) => `${r.querySelector("dt")!.textContent}: ${r.querySelector("dd")!.textContent}`)).toEqual(["Changes: Instructions 3 · Tools 1", "Evaluation: 93.8% pass rate · 92% threshold", "Approved by: Priya Shah, Sam Ortiz"]);
    expect(document.activeElement).toBe(d.querySelector(".ui-rls__cancel"));
    const confirm = d.querySelector<HTMLButtonElement>(".ui-rls__confirm")!;
    expect(text(confirm)).toBe("Promote to Production");
    key(confirm, "Tab");
    expect(document.activeElement).toBe(d.querySelector(".ui-rls__cancel"));
    key(document.activeElement!, "Tab", { shiftKey: true });
    expect(document.activeElement).toBe(confirm);
    key(confirm, "Escape");
    await settle();
    expect(d.open).toBe(false);
    expect(document.activeElement).toBe(promote(el));
    expect(fired).toBe(0);
  });

  test("confirming fires tc-promote; the stage shows Requested until new stages arrive", async () => {
    const el = await make();
    const seen: ReleasePromoteEvent[] = [];
    el.addEventListener("tc-promote", (e) => seen.push((e as CustomEvent<ReleasePromoteEvent>).detail));
    promote(el).click();
    await settle();
    dialog(el).querySelector<HTMLButtonElement>(".ui-rls__confirm")!.click();
    await settle();
    await settle();
    expect(seen).toHaveLength(1);
    expect(seen[0].version.id).toBe("v14");
    expect(seen[0].stage.id).toBe("production");
    expect(seen[0].from?.id).toBe("v13");
    expect(dialog(el).open).toBe(false);
    expect(document.activeElement).toBe(promote(el));
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Promotion of v14 to Production requested.");
    expect(el.querySelector(".ui-rls__pill")!.textContent).toBe("Promotion requested");
    expect(el.querySelector('.ui-rls__stage[data-requested] .ui-rls__tag')!.textContent).toBe("Requested");
    expect(promote(el).getAttribute("aria-disabled")).toBe("true");
    expect(rollbackBtn(el).getAttribute("aria-disabled")).toBe("true");
    // The app answers: production starts rolling out v14
    el.stages = STAGES.map((s) => (s.id === "production" ? { ...s, rollout: { version: "v14", percent: 25 } } : s));
    await settle();
    expect(el.querySelector(".ui-rls__stage[data-requested]")).toBeNull();
    expect(el.querySelector(".ui-rls__pill")!.textContent).toBe("Rolling out");
    expect(text(el.querySelector('.ui-rls__stage[data-role="target"] .ui-rls__roll-text'))).toBe("v14 on 25% of traffic");
    expect(el.querySelector<HTMLElement>(".ui-rls__gate")!.dataset.state).toBe("moving");
    expect(promote(el).getAttribute("aria-disabled")).toBe("true");
    expect(text(el.querySelector(".ui-rls__gate-note"))).toBe("v14 is rolling out to Production: 25% of traffic so far.");
    // Fully out: nothing left to promote
    el.stages = STAGES.map((s) => (s.id === "production" ? { ...s, version: "v14" } : s));
    await settle();
    expect(el.querySelector(".ui-rls__pill")!.textContent).toBe("Fully promoted");
    expect(promote(el)).toBeNull();
    expect(el.querySelector(".ui-rls__candidate")).toBeNull();
  });

  test("a gate that fails while the confirmation is open disables Confirm and says why; it can't promote", async () => {
    const el = await make();
    const seen: ReleasePromoteEvent[] = [];
    el.addEventListener("tc-promote", (e) => seen.push((e as CustomEvent<ReleasePromoteEvent>).detail));
    promote(el).click();
    await settle();
    const confirm = () => dialog(el).querySelector<HTMLButtonElement>(".ui-rls__confirm")!;
    expect(confirm().disabled).toBe(false);
    // An approval is withdrawn and a hold lands after the dialog opened
    el.approvals = [APPROVED[0], { ...APPROVED[1], state: "rejected" }];
    el.hold = "Change freeze until Monday";
    await settle();
    expect(dialog(el).open).toBe(true);
    expect(confirm().disabled).toBe(true);
    expect(text(dialog(el).querySelector(".ui-rls__dlg-blocked"))).toBe("Can't promote now: Sam Ortiz asked for changes; Change freeze until Monday.");
    confirm().click();
    await settle();
    expect(seen).toEqual([]);
    expect(el.querySelector(".ui-rls__stage[data-requested]")).toBeNull();
    // The gate passes again: Confirm works
    el.approvals = APPROVED;
    el.hold = "";
    await settle();
    expect(confirm().disabled).toBe(false);
    expect(dialog(el).querySelector(".ui-rls__dlg-blocked")).toBeNull();
    confirm().click();
    await settle();
    expect(seen).toHaveLength(1);
  });

  test("a rollback that stops making sense while the confirmation is open can't be confirmed", async () => {
    const el = await make();
    const seen: ReleaseRollbackEvent[] = [];
    el.addEventListener("tc-rollback", (e) => seen.push((e as CustomEvent<ReleaseRollbackEvent>).detail));
    rollbackBtn(el).click();
    await settle();
    // Production is already back on v12 by the time Confirm is pressed
    el.stages = STAGES.map((s) => (s.id === "production" ? { ...s, version: "v12" } : s));
    await settle();
    const confirm = dialog(el).querySelector<HTMLButtonElement>(".ui-rls__confirm");
    expect(confirm?.disabled ?? true).toBe(true);
    confirm?.click();
    await settle();
    expect(seen).toEqual([]);
  });

  test("controlled: preventDefault() on tc-promote leaves nothing marked Requested", async () => {
    const el = await make({ look: "clean" });
    el.addEventListener("tc-promote", (e) => e.preventDefault());
    promote(el).click();
    await settle();
    dialog(el).querySelector<HTMLButtonElement>(".ui-rls__confirm")!.click();
    await settle();
    expect(dialog(el).open).toBe(false);
    expect(el.querySelector(".ui-rls__stage[data-requested]")).toBeNull();
    expect(el.querySelector(".ui-rls__pill")!.textContent).toBe("Ready to promote");
  });

  test("Roll back names the stage and exactly what it returns to; tc-rollback carries both versions", async () => {
    const stages = STAGES.map((s) => (s.id === "production" ? { ...s, rollout: { version: "v14", percent: 40 } } : s));
    const el = await make({ stages });
    el.rollback = { stage: "production", version: "v13" };
    await settle();
    const seen: ReleaseRollbackEvent[] = [];
    el.addEventListener("tc-rollback", (e) => seen.push((e as CustomEvent<ReleaseRollbackEvent>).detail));
    rollbackBtn(el).click();
    await settle();
    expect(title(el)).toBe("Roll back Production to v13?");
    expect(text(dialog(el).querySelector(".ui-rls__dlg-lead"))).toBe("Production stops serving v14 (40% of traffic) and returns to v13 – Grounded answers.");
    expect(document.activeElement).toBe(dialog(el).querySelector(".ui-rls__cancel"));
    dialog(el).querySelector<HTMLButtonElement>(".ui-rls__cancel")!.click();
    await settle();
    expect(document.activeElement).toBe(rollbackBtn(el));
    expect(seen).toEqual([]);
    rollbackBtn(el).click();
    await settle();
    dialog(el).querySelector<HTMLButtonElement>(".ui-rls__confirm")!.click();
    await settle();
    expect(seen.map((d) => [d.stage.id, d.from?.id, d.to.id])).toEqual([["production", "v14", "v13"]]);
    expect(el.querySelector(".ui-rls__pill")!.textContent).toBe("Rollback requested");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Rollback of Production to v13 requested.");
  });

  test("nothing to roll back to, nothing deployed, no stages", async () => {
    const el = await make({ stages: [{ id: "draft", label: "Draft", version: "v14" }, { id: "production", label: "Production" }] });
    el.rollback = undefined;
    await settle();
    expect(text(el.querySelector(".ui-rls__rollback .ui-rls__quiet"))).toBe("None – there's no earlier version to return to.");
    expect(rollbackBtn(el)).toBeNull();
    expect(text(el.querySelector('.ui-rls__stage[data-role="target"] .ui-rls__stage-empty'))).toBe("Nothing deployed");
    promote(el).click();
    await settle();
    expect(text(dialog(el).querySelector(".ui-rls__dlg-lead"))).toBe("Production gets its first version, v14.");
    dialog(el).querySelector<HTMLButtonElement>(".ui-rls__cancel")!.click();
    await settle();
    // A rollback target that the stage already runs can't be pressed
    el.rollback = { stage: "draft", version: "v14" };
    await settle();
    expect(rollbackBtn(el).getAttribute("aria-disabled")).toBe("true");
    rollbackBtn(el).click();
    await settle();
    expect(dialog(el).open).toBe(false);
    const empty = await fixture<TcConfigurationReleaseControl>(html`<tc-configuration-release-control></tc-configuration-release-control>`);
    expect(empty.querySelector(".ui-rls__none")!.textContent).toBe("No stages yet.");
    expect(empty.querySelector(".ui-rls__pill")!.textContent).toBe("No candidate");
  });

  test("an explicit target and Compare", async () => {
    const el = await make();
    el.target = "staging";
    el.stages = STAGES.map((s) => (s.id === "staging" ? { ...s, version: "v13" } : s));
    await settle();
    expect(el.querySelector('.ui-rls__stage[data-role="target"] .ui-rls__stage-name')!.textContent).toBe("Staging");
    const seen: ReleaseCompareEvent[] = [];
    el.addEventListener("tc-compare", (e) => seen.push((e as CustomEvent<ReleaseCompareEvent>).detail));
    el.querySelector<HTMLButtonElement>(".ui-rls__compare")!.click();
    expect(seen.map((d) => [d.from?.id, d.to.id])).toEqual([["v13", "v14"]]);
  });

  test("React wrapper: props, callbacks with the event, preventDefault from a callback", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ConfigurationReleaseControl, {
        title: "Assistant release",
        stages: STAGES,
        versions: VERSIONS,
        candidate: "v14",
        evidence: PASSING,
        approvals: APPROVED,
        requiredApprovals: 2,
        rollback: { stage: "production", version: "v12" },
        onPromote: (r, e) => {
          seen.push(["promote", r.version.id, r.stage.id]);
          if (n === 0) e.preventDefault();
        },
        onRollback: (r) => void seen.push(["rollback", r.to.id]),
        onCompare: (r) => void seen.push(["compare", r.from?.id, r.to.id]),
        "data-n": n,
      } as React.ComponentProps<typeof ConfigurationReleaseControl>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-configuration-release-control")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Assistant release");
    el.querySelector<HTMLButtonElement>(".ui-rls__compare")!.click();
    promote(el).click();
    await settle();
    dialog(el).querySelector<HTMLButtonElement>(".ui-rls__confirm")!.click();
    await settle();
    expect(el.querySelector(".ui-rls__stage[data-requested]")).toBeNull();
    await act(async () => bump());
    await settle();
    promote(el).click();
    await settle();
    dialog(el).querySelector<HTMLButtonElement>(".ui-rls__confirm")!.click();
    await settle();
    expect(el.querySelector(".ui-rls__stage[data-requested]")).toBeTruthy();
    // A parent re-render with the same stages keeps the request
    await act(async () => bump());
    await settle();
    expect(el.querySelector(".ui-rls__stage[data-requested]")).toBeTruthy();
    expect(seen).toEqual([
      ["compare", "v13", "v14"],
      ["promote", "v14", "production"],
      ["promote", "v14", "production"],
    ]);
    await act(async () => root.unmount());
  });

  const SUITES: ReleaseSuite[] = [
    { id: "safety", label: "Safety", status: "pass", passed: 7, failed: 0, inconclusive: 0 },
    { id: "retrieval", label: "Retrieval", status: "conditional", passed: 5, failed: 0, inconclusive: 1 },
  ];
  const FINDINGS: ReleaseFinding[] = [
    { id: "f1", ref: "F-001", severity: "P0", title: "Tool ran before approval", status: "Acknowledged", suite: "safety", blocking: true },
    { id: "f2", ref: "F-002", title: "Stale policy cited", status: "Open" },
  ];
  const WAIVERS: ReleaseWaiver[] = [
    { id: "w1", label: "W-001", covers: ["retrieval"], grantedBy: "Dana Lee", expires: "2026-06-10" },
    { id: "w2", label: "W-002", covers: ["f1"], grantedBy: "Sam Ortiz", expires: "2026-05-01" },
  ];
  const gate = (el: Element) => text(document.getElementById(promote(el).getAttribute("aria-describedby")!));
  const checkOf = (el: Element, id: string) => text(el.querySelector(`.ui-rls__check[data-id="${id}"]`));

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: without suites, findings or waivers the gate is unchanged`, async () => {
      const el = await make({ look });
      expect(el.querySelector(".ui-rls__blocks--gate")).toBeNull();
      expect([...el.querySelectorAll(".ui-rls__check")].map((c) => c.getAttribute("data-id"))).toEqual(["evidence", "approvals"]);
      // Unset from a framework (undefined) reads as none
      el.suites = undefined as never;
      el.findings = undefined as never;
      el.waivers = undefined as never;
      await settle();
      expect(el.querySelectorAll(".ui-rls__check")).toHaveLength(2);
    });

    test(`${look}: suites, findings and waivers sit in the gate; an expired waiver counts as unmet`, async () => {
      const el = await make({ look });
      el.suites = SUITES;
      el.findings = FINDINGS;
      el.waivers = WAIVERS;
      await settle();
      expect([...el.querySelectorAll(".ui-rls__check")].map((c) => c.getAttribute("data-id"))).toEqual(["evidence", "suites", "findings", "approvals"]);
      expect(checkOf(el, "suites")).toBe("Suites, met: 1 pass · 1 on a waiver");
      expect(checkOf(el, "findings")).toBe("Findings, met: 2 open · 1 waived");
      expect(promote(el).getAttribute("aria-disabled")).toBe("false");
      // The suites: status, counts, the waiver as given
      const suites = [...el.querySelectorAll(".ui-rls__suite")];
      expect(suites.map((x) => x.getAttribute("data-status"))).toEqual(["pass", "conditional"]);
      expect(text(suites[0].querySelector(".ui-rls__suite-count"))).toBe("7 passed · 0 failed · 0 inconclusive");
      expect(text(suites[1].querySelector(".ui-rls__status"))).toBe("Conditional");
      expect(text(suites[1].querySelector(".ui-rls__waiver"))).toBe("W-001 · expires 2026-06-10 · granted by Dana Lee");
      expect(text(el.querySelector('[data-block="suites"] .ui-rls__label'))).toBe("Gate suites – met");
      // The findings: a count, a list, the waiver
      expect(text(el.querySelector('[data-block="findings"] .ui-rls__label'))).toBe("Open findings2 – met");
      const findings = [...el.querySelectorAll(".ui-rls__finding")];
      expect(text(findings[0].querySelector(".ui-rls__finding-top"))).toBe("F-001 P0 Tool ran before approval");
      expect(text(findings[0].querySelector(".ui-rls__finding-meta"))).toBe("Acknowledged · Safety");
      expect(findings[0].hasAttribute("data-blocking")).toBe(false);
      // Expired: the finding's waiver no longer counts
      el.waivers = [WAIVERS[0], { ...WAIVERS[1], expired: true }];
      await settle();
      expect(checkOf(el, "findings")).toBe("Findings, not met: 1 blocking");
      expect(text(findings[0].querySelector(".ui-rls__waiver"))).toBe("W-002 · expired 2026-05-01 · granted by Sam Ortiz");
      expect(text(findings[0].querySelector(".ui-rls__blocks-tag"))).toBe("Blocks promotion");
      expect(promote(el).getAttribute("aria-disabled")).toBe("true");
      expect(gate(el)).toBe("To promote: 1 blocking finding is open.");
      // A conditional suite whose waiver expired, and a failing suite (no waiver lets it through)
      el.waivers = [{ ...WAIVERS[0], expired: true }, WAIVERS[1]];
      el.suites = [...SUITES, { id: "tools", label: "Tool use", status: "fail" }];
      el.waivers = [...el.waivers, { id: "w3", covers: ["tools"], grantedBy: "X", expires: "2027" }];
      await settle();
      expect(checkOf(el, "suites")).toBe("Suites, not met: 1 failing · 1 conditional");
      expect(gate(el)).toBe("To promote: Retrieval's waiver W-001 has expired, Tool use fails.");
      el.waivers = [];
      el.suites = SUITES;
      await settle();
      expect(gate(el)).toBe("To promote: Retrieval is conditional, with no waiver; 1 blocking finding is open.");
      expect(text(el.querySelectorAll(".ui-rls__suite")[1].querySelector(".ui-rls__waiver"))).toBe("No waiver");
    });
  }

  test("a finding opens through tc-finding-open; the promote confirmation names the suites and waivers", async () => {
    const el = await make();
    el.suites = SUITES;
    el.findings = FINDINGS;
    el.waivers = WAIVERS;
    await settle();
    const opened: ReleaseFindingOpenEvent[] = [];
    el.addEventListener("tc-finding-open", (e) => opened.push((e as CustomEvent<ReleaseFindingOpenEvent>).detail));
    el.querySelectorAll<HTMLButtonElement>(".ui-rls__finding-btn")[1].click();
    expect(opened.map((o) => o.finding.id)).toEqual(["f2"]);
    promote(el).click();
    await settle();
    const facts = [...dialog(el).querySelectorAll(".ui-rls__facts > div")].map((r) => `${r.querySelector("dt")!.textContent}: ${text(r.querySelector("dd"))}`);
    expect(facts).toContain("Suites: 1 of 2 suites pass, 1 on a waiver");
    expect(facts).toContain("Waivers: W-001 by Dana Lee, expires 2026-06-10; W-002 by Sam Ortiz, expires 2026-05-01");
    dialog(el).querySelector<HTMLButtonElement>(".ui-rls__cancel")!.click();
    await settle();
  });

  test("React wrapper: onOpenFinding gets the finding", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(ConfigurationReleaseControl, { stages: STAGES, versions: VERSIONS, candidate: "v14", evidence: PASSING, findings: FINDINGS, onOpenFinding: (f) => void seen.push(f.id) }),
      ),
    );
    await settle();
    host.querySelector<HTMLButtonElement>(".ui-rls__finding-btn")!.click();
    expect(seen).toEqual(["f1"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with the dialog open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-configuration-release-control candidate="v14" required-approvals="2" .stages=${STAGES} .versions=${VERSIONS} .changes=${CHANGES} .evidence=${PASSING} .approvals=${[APPROVED[0], { id: "x", name: "Sam Ortiz", state: "pending" }]} .rollback=${{ stage: "production", version: "v12" }} .suites=${[...SUITES, { id: "t", label: "Tools", status: "fail" }]} .findings=${FINDINGS} .waivers=${[WAIVERS[0], { ...WAIVERS[1], expired: true }]}></tc-configuration-release-control>
        <tc-configuration-release-control look="clean" candidate="v14" .stages=${STAGES.map((s) => (s.id === "production" ? { ...s, rollout: { version: "v14", percent: 30 } } : s))} .versions=${VERSIONS} .changes=${CHANGES} .evidence=${{ passRate: 80, baseline: 90, threshold: 92 }} .approvals=${APPROVED} .rollback=${{ stage: "production", version: "v13" }} .suites=${SUITES} .findings=${FINDINGS} .waivers=${WAIVERS}></tc-configuration-release-control>
      </div>`);
      const [, b] = wrap.querySelectorAll<TcConfigurationReleaseControl>("tc-configuration-release-control");
      rollbackBtn(b).click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      dialog(b).close();
    });
  }
});
