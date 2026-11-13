/*
 * <tc-quality-alerts> in real browsers: rules as sentences with labelled slots, problems in words, edits and their
 * events, invalid numbers kept out, the switch, add and remove with focus, last fired and the preview, controlled
 * rules, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/quality-alerts";
import type { QualityAlertRule, QualityAlertsChange, TcQualityAlerts } from "../../src/elements/quality-alerts";
import { qualityAlertProblem, qualityAlertSentence } from "../../src/elements/quality-alerts";
import { QualityAlerts } from "../../src/elements/react/quality-alerts";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const CHANNELS = [
  { id: "ops", label: "#ops-quality" },
  { id: "policy", label: "#policy-team" },
];
const METRICS = [
  { id: "correctness", label: "Correctness", min: 1, max: 5 },
  { id: "cites", label: "Cites policy", min: 0, max: 1, step: 0.05 },
];
const WINDOWS = [
  { id: "24h", label: "24 hours" },
  { id: "7d", label: "7 days" },
];
const NOW = Date.parse("2026-11-12T09:30:00");
const RULES: QualityAlertRule[] = [
  { id: "r1", channel: "ops", metric: "correctness", comparison: "below", threshold: 3.5, window: "24h", minChats: 50, enabled: true, lastTriggered: NOW - 3 * 3_600_000, preview: 4 },
  { id: "r2", channel: "policy", metric: "cites", comparison: "drops-by", threshold: 0.15, window: "7d", minChats: 200, enabled: false, preview: 0 },
];

const rule = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-rule="${id}"]`)!;
const field = <T extends HTMLElement>(el: Element, id: string, name: string) => rule(el, id).querySelector<T>(`[data-field="${name}"]`)!;
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const change = (input: HTMLInputElement | HTMLSelectElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("change", { bubbles: true }));
};
const make = (look: "standard" | "clean" = "standard", rules = RULES) =>
  fixture<TcQualityAlerts>(
    html`<tc-quality-alerts look=${look} locale="en-US" .channels=${CHANNELS} .metrics=${METRICS} .windows=${WINDOWS} .rules=${rules} .now=${NOW}></tc-quality-alerts>`,
  );

describe("tc-quality-alerts", () => {
  test("qualityAlertSentence and qualityAlertProblem", () => {
    expect(qualityAlertSentence(RULES[0], { channels: CHANNELS, metrics: METRICS, windows: WINDOWS })).toBe(
      "Alert #ops-quality when Correctness drops below 3.5 over 24 hours on at least 50 chats",
    );
    expect(qualityAlertProblem(RULES[0], METRICS[0])).toBe("");
    expect(qualityAlertProblem({ ...RULES[0], threshold: 7 }, METRICS[0])).toBe("Correctness runs from 1 to 5; choose a threshold in that range.");
    expect(qualityAlertProblem({ ...RULES[1], threshold: 2 }, METRICS[1])).toBe("A drop must be more than 0 and at most 1.");
    expect(qualityAlertProblem({ ...RULES[0], minChats: 0 }, METRICS[0])).toMatch(/at least 1/);
    expect(qualityAlertProblem(RULES[0], undefined)).toBe("Choose what to watch.");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: each rule a fieldset with the sentence, labelled slots, facts, a switch and Remove`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("qal");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-qal__count")!.textContent).toBe("2 rules · 1 on");
      const set = rule(el, "r1").querySelector("fieldset")!;
      expect(set.querySelector("legend")!.textContent).toBe("Rule 1");
      const described = set.getAttribute("aria-describedby")!.split(" ").map((id) => document.getElementById(id)!.textContent);
      expect(described[0]).toBe("Alert #ops-quality when Correctness drops below 3.5 over 24 hours on at least 50 chats");
      expect(described[1]).toBe("Last fired 3h ago · Would have fired 4 times in the last 30 days");
      for (const [name, label] of [
        ["channel", "Channel"],
        ["metric", "Metric"],
        ["comparison", "Comparison"],
        ["threshold", "Threshold"],
        ["window", "Window"],
        ["minChats", "Minimum chats"],
      ])
        expect((field<HTMLInputElement>(el, "r1", name).labels![0] as HTMLLabelElement).textContent).toBe(label);
      expect(field<HTMLSelectElement>(el, "r1", "comparison").value).toBe("below");
      expect(field<HTMLInputElement>(el, "r1", "threshold").value).toBe("3.5");
      expect(rule(el, "r2").hasAttribute("data-off")).toBe(true);
      expect(rule(el, "r2").querySelector(".ui-qal__facts")!.textContent).toBe("Off · Hasn't fired yet · Wouldn't have fired in the last 30 days");
      const sw = rule(el, "r2").querySelector<HTMLButtonElement>('[role="switch"]')!;
      expect(sw.getAttribute("aria-checked")).toBe("false");
      expect(sw.textContent!.trim()).toBe("On");
      expect(rule(el, "r2").querySelector(".ui-qal__remove")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Remove rule 2");
    });
  }

  test("editing a slot fires tc-rules-change with the whole list and drops the stale preview; prevented, it stays", async () => {
    const el = await make();
    const seen: QualityAlertsChange[] = [];
    el.addEventListener("tc-rules-change", (e) => seen.push((e as CustomEvent<QualityAlertsChange>).detail));
    change(field<HTMLSelectElement>(el, "r1", "channel"), "policy");
    await settle();
    expect(seen[0].change).toBe("edit");
    expect(seen[0].id).toBe("r1");
    expect(seen[0].rules[0]).toMatchObject({ channel: "policy", preview: undefined });
    expect(seen[0].rules[1]).toBe(RULES[1]);
    expect(el.rules[0].channel).toBe("policy");
    expect(rule(el, "r1").querySelector(".ui-qal__facts")!.textContent).toBe("Last fired 3h ago");
    change(field<HTMLInputElement>(el, "r1", "threshold"), "4.2");
    await settle();
    expect(el.rules[0].threshold).toBe(4.2);
    el.addEventListener("tc-rules-change", (e) => e.preventDefault(), { once: true });
    change(field<HTMLSelectElement>(el, "r1", "window"), "7d");
    await settle();
    expect(el.rules[0].window).toBe("24h");
    expect(field<HTMLSelectElement>(el, "r1", "window").value).toBe("24h");
  });

  test("a number that can't work is said in words, marked invalid and not kept", async () => {
    const el = await make();
    let fired = 0;
    el.addEventListener("tc-rules-change", () => fired++);
    const threshold = field<HTMLInputElement>(el, "r1", "threshold");
    change(threshold, "9");
    await settle();
    expect(fired).toBe(0);
    expect(el.rules[0].threshold).toBe(3.5);
    expect(threshold.getAttribute("aria-invalid")).toBe("true");
    expect(threshold.value).toBe("9");
    expect(document.getElementById(threshold.getAttribute("aria-describedby")!)!.textContent).toBe("Correctness runs from 1 to 5; choose a threshold in that range.");
    expect(rule(el, "r1").hasAttribute("data-invalid")).toBe(true);
    change(threshold, "2.5");
    await settle();
    expect(fired).toBe(1);
    expect(threshold.getAttribute("aria-invalid")).toBe("false");
    expect(rule(el, "r1").querySelector(".ui-qal__problem")).toBeNull();
    const min = field<HTMLInputElement>(el, "r1", "minChats");
    change(min, "");
    await settle();
    expect(rule(el, "r1").querySelector(".ui-qal__problem")!.textContent).toBe("Enter how many chats.");
    expect(el.rules[0].minChats).toBe(50);
  });

  test("the switch turns a rule on and off, and says so", async () => {
    const el = await make();
    const sw = rule(el, "r2").querySelector<HTMLButtonElement>('[role="switch"]')!;
    sw.click();
    await settle();
    expect(el.rules[1].enabled).toBe(true);
    expect(sw.getAttribute("aria-checked")).toBe("true");
    expect(status(el)).toBe("Turned on: Alert #policy-team when Cites policy falls by more than 0.15 over 7 days on at least 200 chats");
    expect(el.querySelector(".ui-qal__count")!.textContent).toBe("2 rules · 2 on");
  });

  test("Add rule adds one with defaults and focuses it; Remove moves the focus on", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-rules-change", (e) => seen.push((e as CustomEvent<QualityAlertsChange>).detail.change));
    el.querySelector<HTMLButtonElement>(".ui-qal__add")!.click();
    await settle();
    expect(el.rules).toHaveLength(3);
    const added = el.rules[2];
    expect(added).toMatchObject({ channel: "ops", metric: "correctness", comparison: "below", threshold: 3.8, window: "24h", minChats: 50, enabled: true });
    await expect.poll(() => document.activeElement).toBe(field(el, added.id, "channel"));
    expect(status(el)).toMatch(/^Rule added: Alert #ops-quality when Correctness drops below 3.8/);
    rule(el, "r1").querySelector<HTMLButtonElement>(".ui-qal__remove")!.click();
    await settle();
    expect(el.rules.map((r) => r.id)).toEqual(["r2", added.id]);
    await expect.poll(() => document.activeElement).toBe(field(el, "r2", "channel"));
    expect(seen).toEqual(["add", "remove"]);
    rule(el, "r2").querySelector<HTMLButtonElement>(".ui-qal__remove")!.click();
    await settle();
    rule(el, added.id).querySelector<HTMLButtonElement>(".ui-qal__remove")!.click();
    await settle();
    expect(el.querySelector(".ui-qal__empty")!.textContent).toMatch(/No alert rules yet/);
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-qal__add"));
  });

  test("without now, last fired is a date; renamed words are used", async () => {
    const el = await make();
    el.now = undefined;
    el.labels = { on: "Active", comparisons: { below: "goes under" } as never };
    await settle();
    expect(rule(el, "r1").querySelector(".ui-qal__facts")!.textContent).toMatch(/^Last fired Nov 12/);
    expect(rule(el, "r1").querySelector('[role="switch"]')!.textContent!.trim()).toBe("Active");
    expect([...field<HTMLSelectElement>(el, "r1", "comparison").options].map((o) => o.textContent)).toEqual(["goes under", "falls by more than", "rises above"]);
  });

  test("React wrapper: uncontrolled rules survive re-renders; controlled ones wait for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    const render = (n: number, controlled: boolean) =>
      root.render(
        React.createElement(QualityAlerts, {
          title: `Alerts ${n}`,
          channels: CHANNELS,
          metrics: METRICS,
          windows: WINDOWS,
          ...(controlled ? { rules: RULES } : { defaultRules: RULES }),
          onRulesChange: (_, id, kind) => void seen.push(`${kind} ${id}`),
        }),
      );
    await act(async () => render(1, false));
    await settle();
    const el = host.querySelector("tc-quality-alerts")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Alerts 1");
    rule(el, "r2").querySelector<HTMLButtonElement>('[role="switch"]')!.click();
    await settle();
    await act(async () => render(2, false));
    await settle();
    expect(el.rules[1].enabled).toBe(true);
    await act(async () => root.unmount());
    const root2 = createRoot(host);
    await act(async () =>
      root2.render(React.createElement(QualityAlerts, { channels: CHANNELS, metrics: METRICS, windows: WINDOWS, rules: RULES, onRulesChange: (_, id, kind) => void seen.push(`${kind} ${id}`) })),
    );
    await settle();
    const el2 = host.querySelector("tc-quality-alerts")!;
    rule(el2, "r2").querySelector<HTMLButtonElement>('[role="switch"]')!.click();
    await settle();
    expect(el2.rules[1].enabled).toBe(false);
    expect(seen).toEqual(["toggle r2", "toggle r2"]);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-quality-alerts description="Policy desk" .channels=${CHANNELS} .metrics=${METRICS} .windows=${WINDOWS} .rules=${RULES} .now=${NOW}></tc-quality-alerts>
        <tc-quality-alerts look="clean" .channels=${CHANNELS} .metrics=${METRICS} .windows=${WINDOWS} .rules=${[{ ...RULES[0], threshold: 9 }, RULES[1]]}></tc-quality-alerts>
        <tc-quality-alerts look="clean" .channels=${CHANNELS} .metrics=${METRICS} .windows=${WINDOWS}></tc-quality-alerts>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
