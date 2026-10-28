/*
 * <tc-red-team-finding> in real browsers: the findings listbox (one tab stop, ↑ ↓ Home End pick and the detail
 * follows), the open count, the detail's pills, invariants, scenario, evidence and response ledger; cancelable picks;
 * evidence and Run again as events when switched on; renamed labels; empty states; narrow layout; the React wrapper
 * (uncontrolled and controlled, undo with the finding); axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/red-team-finding";
import type { Finding, FindingChange, FindingEvidenceOpen, TcRedTeamFinding } from "../../src/elements/red-team-finding";
import { RedTeamFinding } from "../../src/elements/react/red-team-finding";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 9, 27, 9, 30);
const finding = (id: string, title: string, extra: Partial<Finding> = {}): Finding => ({
  id,
  code: id.toUpperCase(),
  title,
  severity: "critical",
  status: "open",
  opened: "1h ago",
  area: "policy",
  summary: `${title} happened.`,
  affected: ["Policy engine"],
  invariants: [{ id: "i", rule: `${id}.must-hold`, detail: "Always" }],
  scenario: { id: `scn-${id}`, description: "A scenario.", tags: ["privilege"] },
  evidence: [{ id: "e1", label: "Run trace", detail: "41 steps" }],
  responses: [{ id: "r1", action: "Paused tool", target: "email.send", system: "Tool gateway", at: NOW - 60_000 }],
  ...extra,
});
const FINDINGS = [finding("f-1", "First"), finding("f-2", "Second", { severity: "high", status: "investigating" }), finding("f-3", "Third", { status: "resolved", severity: "low" })];
const make = (look: "standard" | "clean" = "standard") => fixture<TcRedTeamFinding>(html`<tc-red-team-finding look=${look} .now=${NOW} .findings=${FINDINGS}></tc-red-team-finding>`);
const title = (el: Element) => el.querySelector(".ui-rtf__title")?.textContent;
const options = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="option"]')];

describe("tc-red-team-finding", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a listbox with one tab stop and the open count; the first finding's detail`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rtf");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector('[role="listbox"]')!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Findings");
      expect(options(el).filter((o) => o.tabIndex === 0)).toHaveLength(1);
      expect(options(el)[0].getAttribute("aria-selected")).toBe("true");
      expect(el.querySelector(".tc-head__aside .ui-rtf__pill")!.textContent).toBe("2 open");
      expect(title(el)).toBe("First");
      const detail = el.querySelector(".ui-rtf__detail")!;
      expect(detail.querySelector(".ui-rtf__pill[data-tone='danger']")!.textContent).toBe("Critical");
      expect(detail.querySelector(".ui-rtf__rule")!.textContent).toBe("f-1.must-hold");
      expect(detail.textContent).toContain("1 failed");
      expect(detail.querySelector('[aria-label="Affected"]')!.textContent).toContain("Policy engine");
      expect(detail.querySelector(".ui-rtf__mono")!.textContent).toBe("scn-f-1");
      expect(detail.querySelector("div.ui-rtf__ev")).not.toBeNull();
      expect(detail.querySelector("button.ui-rtf__ev")).toBeNull();
      expect(detail.querySelector("tc-agent-ledger")!.getAttribute("data-look")).toBe(look);
    });
  }

  test("↑ ↓ Home End pick and the detail follows, with focus on the pick", async () => {
    const el = await make();
    const changes: FindingChange[] = [];
    el.addEventListener("tc-finding-change", (e) => changes.push((e as CustomEvent<FindingChange>).detail));
    options(el)[0].focus();
    await userEvent.keyboard("{ArrowDown}");
    await settle();
    expect(title(el)).toBe("Second");
    expect(document.activeElement).toBe(options(el)[1]);
    await userEvent.keyboard("{End}");
    await settle();
    expect(title(el)).toBe("Third");
    await userEvent.keyboard("{Home}");
    await settle();
    expect(title(el)).toBe("First");
    expect(changes).toEqual([{ finding: "f-2" }, { finding: "f-3" }, { finding: "f-1" }]);
    expect(document.activeElement?.getAttribute("aria-selected")).toBe("true");
  });

  test("tc-finding-change prevented: the pick stays (controlled use)", async () => {
    const el = await make();
    el.addEventListener("tc-finding-change", (e) => e.preventDefault());
    options(el)[2].click();
    await settle();
    expect(title(el)).toBe("First");
    el.finding = "f-3";
    await settle();
    expect(title(el)).toBe("Third");
  });

  test("evidence rows and Run again, when switched on, fire events with the finding", async () => {
    const el = await make();
    el.openEvidence = true;
    el.rerun = true;
    await settle();
    const opened: string[] = [];
    const reruns: string[] = [];
    el.addEventListener("tc-evidence-open", (e) => {
      const d = (e as CustomEvent<FindingEvidenceOpen>).detail;
      opened.push(`${d.finding.id}:${d.evidence.id}`);
    });
    el.addEventListener("tc-rerun", (e) => reruns.push((e as CustomEvent<{ finding: Finding }>).detail.finding.id));
    el.querySelector<HTMLButtonElement>("button.ui-rtf__ev")!.click();
    [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.includes("Run again"))!.click();
    await settle();
    expect(opened).toEqual(["f-1:e1"]);
    expect(reruns).toEqual(["f-1"]);
  });

  test("renamed labels; empty states; nothing found", async () => {
    const empty = finding("x", "Empty", { invariants: [], evidence: [], affected: [] });
    const el = await fixture<TcRedTeamFinding>(html`<tc-red-team-finding heading="Issues" .severityLabels=${{ critical: "Kritisch" }} .statusLabels=${{ open: "Offen" }} .findings=${[empty]}></tc-red-team-finding>`);
    expect(el.textContent).toContain("Kritisch");
    expect(el.textContent).toContain("Offen");
    expect(el.textContent).toContain("Every invariant held.");
    expect(el.textContent).toContain("No evidence attached.");
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Issues");
    el.findings = [];
    await settle();
    expect(el.textContent).toContain("Nothing found yet.");
    expect(el.querySelector(".ui-rtf__detail")).toBeNull();
  });

  test("narrow: the list sits above the detail", async () => {
    const el = await make();
    el.style.width = "360px";
    await settle();
    const list = el.querySelector(".ui-rtf__list")!.getBoundingClientRect();
    const detail = el.querySelector(".ui-rtf__detail")!.getBoundingClientRect();
    expect(detail.top).toBeGreaterThanOrEqual(list.bottom - 1);
  });

  test("React: uncontrolled picks survive re-renders; controlled waits; undo gets the finding", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picks: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RedTeamFinding, { findings: FINDINGS, now: NOW, onFindingChange: (id) => void picks.push(id), "data-n": n } as React.ComponentProps<typeof RedTeamFinding>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    let el = host.querySelector("tc-red-team-finding")!;
    await act(async () => options(el)[1].click());
    await settle();
    await act(async () => bump());
    await settle();
    expect(title(el)).toBe("Second");
    expect(picks).toEqual(["f-2"]);

    const undone: string[] = [];
    await act(async () =>
      root.render(React.createElement(RedTeamFinding, { findings: FINDINGS, now: NOW, finding: "f-1", onFindingChange: (id) => void picks.push(id), onUndo: (ids, f) => void undone.push(`${f.id}:${ids.join()}`) })),
    );
    await settle();
    el = host.querySelector("tc-red-team-finding")!;
    await act(async () => options(el)[2].click());
    await settle();
    expect(picks).toEqual(["f-2", "f-3"]);
    expect(title(el)).toBe("First");
    const undo = [...el.querySelectorAll<HTMLButtonElement>("tc-agent-ledger button")].find((b) => /undo/i.test(b.textContent ?? ""))!;
    await act(async () => undo.click());
    await settle();
    expect(undone).toEqual(["f-1:r1"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="display: grid; gap: 24px; padding: 16px; background: var(--tc-surface-base)">
        <tc-red-team-finding .now=${NOW} .findings=${FINDINGS} open-evidence rerun></tc-red-team-finding>
        <tc-red-team-finding look="clean" .now=${NOW} .findings=${FINDINGS} finding="f-2"></tc-red-team-finding>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
