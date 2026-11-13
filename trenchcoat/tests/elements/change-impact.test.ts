/*
 * <tc-change-impact> in real browsers: the verdict maths (scores and pass counts, lower-is-better), the rows and the
 * summary line, cost and latency, the segment switch (controlled and not), the examples event, the wrapper, axe in
 * both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/change-impact";
import {
  changeImpact,
  type ChangeImpactExamplesOpen,
  type ChangeImpactSegmentChange,
  type ImpactCriterion,
  type ImpactSegment,
  type TcChangeImpact,
} from "../../src/elements/change-impact";
import { ChangeImpact } from "../../src/elements/react/change-impact";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const CHANGE = { label: "Prompt v13 → v14", before: "v13", after: "v14" };
const CRITERIA: ImpactCriterion[] = [
  { id: "correct", label: "Correctness", before: { mean: 4.42, n: 1240, sd: 0.9 }, after: { mean: 3.81, n: 1184, sd: 1.1 } },
  { id: "cites", label: "Cites policy", before: { passes: 1066, n: 1240 }, after: { passes: 829, n: 1184 } },
  { id: "helpful", label: "Helpfulness", before: { mean: 4.18, n: 1240, sd: 0.9 }, after: { mean: 4.21, n: 1184, sd: 0.9 } },
  { id: "tone", label: "Tone", before: { mean: 4.31, n: 1240, sd: 0.8 }, after: { mean: 4.52, n: 1184, sd: 0.7 } },
];
const SEGMENTS: ImpactSegment[] = [
  {
    id: "leave",
    label: "Leave",
    criteria: [{ id: "tone", label: "Tone", before: { mean: 4.3, n: 300 }, after: { mean: 4.35, n: 300 } }],
    cost: { before: 0.01, after: 0.01 },
  },
];
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();
const verdicts = (el: Element) => [...el.querySelectorAll(".ui-chi__verdict")].map((v) => text(v));

describe("tc-change-impact", () => {
  test("changeImpact: z from the spread or pass counts; likely past z; lower-is-better flips the verdict", () => {
    const [correct, cites, helpful, tone] = CRITERIA.map((c) => changeImpact(c));
    expect(correct.verdict).toBe("worse");
    expect(correct.delta).toBeCloseTo(-0.61);
    expect(correct.z).toBeLessThan(-10);
    expect(cites.rate).toBe(true);
    expect(cites.before).toBeCloseTo(1066 / 1240);
    expect(cites.verdict).toBe("worse");
    expect(helpful.verdict).toBe("same");
    expect(tone.verdict).toBe("better");
    const refusals = changeImpact({ id: "r", label: "Refusals", higherIsBetter: false, before: { passes: 120, n: 1000 }, after: { passes: 60, n: 1000 } });
    expect(refusals.verdict).toBe("better");
    // A bigger spread, a weaker case: the same means are no longer "likely"
    expect(changeImpact(CRITERIA[3], 1, 1.96).verdict).toBe("better");
    expect(changeImpact({ ...CRITERIA[3], before: { mean: 4.31, n: 20 }, after: { mean: 4.52, n: 20 } }, 1).verdict).toBe("same");
    // No chats: nothing to say
    expect(changeImpact({ id: "x", label: "X", before: { mean: 4, n: 0 }, after: { mean: 3, n: 0 } }).verdict).toBe("same");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a row per criterion with its verdict in words; the summary line; samples; cost and latency`, async () => {
      const el = await fixture<TcChangeImpact>(html`<tc-change-impact
        look=${look}
        .change=${CHANGE}
        .criteria=${CRITERIA}
        .cost=${{ before: 0.0118, after: 0.0096 }}
        .latency=${{ before: 2140, after: 1820 }}
      ></tc-change-impact>`);
      expect(el.dataset.ui).toBe("chi");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".tc-head__sub"))).toBe("Prompt v13 → v14");
      expect(text(el.querySelector(".ui-chi__overall"))).toBe("Mixed");
      expect(verdicts(el)).toEqual(["Worse, likely", "Worse, likely", "No clear change", "Better, likely"]);
      expect(text(el.querySelector(".ui-chi__line"))).toBe("Better on Tone, worse on Correctness and Cites policy, no clear change on Helpfulness, cost down 19%.");
      expect(text(el.querySelector(".ui-chi__samples"))).toBe("1,240 chats on v13 · 1,184 on v14");
      const first = el.querySelector(".ui-chi__row")!;
      expect(text(first.querySelector(".ui-chi__nums"))).toBe("4.42→ to 3.81 −0.61");
      expect(text(first.querySelector(".ui-chi__n"))).toBe("1,240 → 1,184 chats");
      expect(text(el.querySelectorAll(".ui-chi__row")[1].querySelector(".ui-chi__nums"))).toMatch(/^86%→ to 70% −1[56](\.\d)? pts$/);
      // The dumbbell is drawn and hidden; the after dot left of the before one when it fell
      const bell = first.querySelector<HTMLElement>(".ui-chi__bell")!;
      expect(bell.getAttribute("aria-hidden")).toBe("true");
      const [before, after] = [...bell.querySelectorAll<HTMLElement>(".ui-chi__dot")];
      expect(parseFloat(after.style.left)).toBeLessThan(parseFloat(before.style.left));
      expect(el.querySelector(".ui-chi__rows")!.getAttribute("aria-label")).toBe("Criteria");
      const metrics = [...el.querySelectorAll(".ui-chi__metric")].map((m) => text(m));
      expect(metrics).toEqual(["Cost per chat $0.0118 → to $0.0096 −19%, lower", "Median latency 2.1 s → to 1.8 s −15%, lower"]);
      // Example buttons: visible side name, named with the criterion
      const ex = [...first.querySelectorAll<HTMLButtonElement>(".ui-chi__ex")];
      expect(ex.map((b) => text(b))).toEqual(["v13 examples, Correctness", "v14 examples, Correctness"]);
    });
  }

  test("examples fire tc-examples-open with the criterion and side", async () => {
    const el = await fixture<TcChangeImpact>(html`<tc-change-impact .change=${CHANGE} .criteria=${CRITERIA}></tc-change-impact>`);
    const seen: ChangeImpactExamplesOpen[] = [];
    el.addEventListener("tc-examples-open", (e) => seen.push((e as CustomEvent<ChangeImpactExamplesOpen>).detail));
    const rows = el.querySelectorAll(".ui-chi__row");
    rows[1].querySelectorAll<HTMLButtonElement>(".ui-chi__ex")[1].click();
    rows[3].querySelectorAll<HTMLButtonElement>(".ui-chi__ex")[0].click();
    expect(seen).toEqual([
      { criterion: "cites", side: "after" },
      { criterion: "tone", side: "before" },
    ]);
  });

  test("segment: the switch reads one slice and says it; tc-segment-change; preventDefault keeps all traffic", async () => {
    const el = await fixture<TcChangeImpact>(html`<tc-change-impact .change=${CHANGE} .criteria=${CRITERIA} .cost=${{ before: 0.0118, after: 0.0096 }} .segments=${SEGMENTS}></tc-change-impact>`);
    const seen: unknown[] = [];
    el.addEventListener("tc-segment-change", (e) => seen.push((e as CustomEvent<ChangeImpactSegmentChange>).detail.segment));
    const select = el.querySelector<HTMLSelectElement>("select")!;
    expect(el.querySelector(`label[for="${select.id}"]`)!.textContent).toBe("Segment");
    expect([...select.options].map((o) => o.textContent)).toEqual(["All traffic", "Leave"]);
    el.addEventListener("tc-segment-change", (e) => e.preventDefault(), { once: true });
    select.value = "leave";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.segment).toBeNull();
    expect(select.value).toBe("");
    expect(el.querySelectorAll(".ui-chi__row")).toHaveLength(4);
    select.value = "leave";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.segment).toBe("leave");
    expect(el.querySelectorAll(".ui-chi__row")).toHaveLength(1);
    expect(verdicts(el)).toEqual(["No clear change"]);
    expect(text(el.querySelector(".ui-chi__overall"))).toBe("No clear change");
    await expect.poll(() => text(el.querySelector('[role="status"]'))).toBe("Leave: No clear change on Tone, cost unchanged.");
    expect(seen).toEqual(["leave", "leave"]);
  });

  test("no criteria: an empty state and no pill; scores keep to min and max", async () => {
    const el = await fixture<TcChangeImpact>(html`<tc-change-impact></tc-change-impact>`);
    expect(text(el.querySelector(".ui-chi__empty"))).toBe("No criteria yet");
    expect(el.querySelector(".ui-chi__overall")).toBeNull();
    expect(text(el.querySelector(".ui-chi__line"))).toBe("No criteria yet.");
    const off = await fixture<TcChangeImpact>(html`<tc-change-impact .criteria=${[{ id: "x", label: "X", before: { mean: 9, n: 10 }, after: { mean: -2, n: 10 } }]}></tc-change-impact>`);
    expect([...off.querySelectorAll<HTMLElement>(".ui-chi__dot[data-side]")].filter((d) => d.closest(".ui-chi__bell")).map((d) => d.style.left)).toEqual(["100%", "0%"]);
  });

  test("React wrapper: uncontrolled segment survives a parent re-render; controlled stays; onExamplesOpen", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ChangeImpact, {
        title: "Did v14 help?",
        change: CHANGE,
        criteria: CRITERIA,
        segments: SEGMENTS,
        onSegmentChange: (s) => seen.push(s),
        onExamplesOpen: (c, side) => seen.push(`${c}:${side}`),
        "data-n": n,
      } as React.ComponentProps<typeof ChangeImpact>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-change-impact")!;
    expect(el.heading).toBe("Did v14 help?");
    const select = el.querySelector<HTMLSelectElement>("select")!;
    select.value = "leave";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.segment).toBe("leave");
    el.querySelector<HTMLButtonElement>(".ui-chi__ex")!.click();
    expect(seen).toEqual(["leave", "tone:before"]);
    // Controlled: the parent's value holds
    await act(async () => root.render(React.createElement(ChangeImpact, { criteria: CRITERIA, segments: SEGMENTS, segment: null })));
    await settle();
    const el2 = host.querySelector("tc-change-impact")!;
    const s2 = el2.querySelector<HTMLSelectElement>("select")!;
    s2.value = "leave";
    s2.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el2.segment).toBeNull();
    expect(s2.value).toBe("");
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme, wide and narrow", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <div style="width: 780px"><tc-change-impact .change=${CHANGE} .criteria=${CRITERIA} .cost=${{ before: 0.0118, after: 0.0096 }} .latency=${{ before: 2140, after: 1820 }} .segments=${SEGMENTS}></tc-change-impact></div>
        <div style="width: 780px"><tc-change-impact look="clean" .change=${CHANGE} .criteria=${CRITERIA} .latency=${{ before: 1800, after: 2400 }}></tc-change-impact></div>
        <div style="width: 340px"><tc-change-impact look="clean" .change=${CHANGE} .criteria=${CRITERIA} .segments=${SEGMENTS}></tc-change-impact></div>
        <div style="width: 340px"><tc-change-impact></tc-change-impact></div>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
