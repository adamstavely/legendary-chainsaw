/*
 * <tc-correction-propagation> in real browsers: the host and both looks, the correction, grouping and progress, the
 * three actions and Undo (events, states, nothing rewritten), controlled use, focus, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/correction-propagation";
import type { CorrectionCandidate, TcCorrectionPropagation } from "../../src/elements/correction-propagation";
import { CorrectionPropagation } from "../../src/elements/react/correction-propagation";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const LIST: CorrectionCandidate[] = [
  { id: "p1", kind: "package", title: "Q3 report", version: "v2.1", detail: "Sent to the board", quote: "Credits capped at 15%" },
  { id: "a1", title: "Risk memo", detail: "Draft" },
  { id: "a2", title: "Board slide" },
  { id: "a3", title: "Team FAQ", state: "reviewed" },
];
const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const make = (attrs: { look?: string; states?: Record<string, string> } = {}) =>
  fixture<TcCorrectionPropagation>(
    html`<tc-correction-propagation
      look=${attrs.look ?? "standard"}
      heading="Reach"
      claim="Capped at 15%"
      correction="Capped at 10%"
      reason="The contract says ten"
      meta="Dana · 10:42"
      .states=${attrs.states ?? {}}
      .candidates=${LIST}
    ></tc-correction-propagation>`,
  );
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-cpr__row[data-id="${id}"]`)!;
const btn = (el: Element, id: string, kind: string) => row(el, id).querySelector<HTMLButtonElement>(`.ui-cpr__btn[data-kind="${kind}"]`);
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);

describe("tc-correction-propagation", () => {
  for (const look of looks) {
    test(`${look}: the host is the root and a region named by its heading`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("cpr");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Reach");
      expect(plain(el.querySelector(".ui-cpr__sum")!.textContent)).toBe("4 cite it 1 released");
    });
  }

  test("the correction: the old wording struck through, the new one, the reason and who", async () => {
    const el = await make();
    expect(el.querySelector(".ui-cpr__before del")!.textContent).toBe("Capped at 15%");
    expect(plain(el.querySelector(".ui-cpr__before")!.textContent)).toBe("Was: Capped at 15%");
    expect(plain(el.querySelector(".ui-cpr__after")!.textContent)).toBe("Now: Capped at 10%");
    expect(plain(el.querySelector(".ui-cpr__why")!.textContent)).toBe("The contract says ten·Dana · 10:42");
  });

  test("released packages and artifacts in their own groups; a candidate's own state counts; progress", async () => {
    const el = await make();
    expect([...el.querySelectorAll(".ui-cpr__group h4")].map((h) => h.textContent)).toEqual(["Released packages · 1", "Artifacts · 3"]);
    expect(plain(row(el, "p1").querySelector(".ui-cpr__tag")!.textContent)).toBe("Released v2.1");
    expect(row(el, "p1").querySelector("q")!.textContent).toBe("Credits capped at 15%");
    expect(row(el, "a3").dataset.state).toBe("reviewed");
    expect(btn(el, "a3", "review")).toBeNull();
    expect(plain(row(el, "a3").querySelector(".ui-cpr__state")!.textContent)).toBe("Reviewed");
    expect(plain(el.querySelector(".ui-cpr__progress-text")!.textContent)).toBe("1 of 4 handled3 pending");
    const meter = el.querySelector('[role="progressbar"]')!;
    expect(meter.getAttribute("aria-valuenow")).toBe("1");
    expect(meter.getAttribute("aria-valuetext")).toBe("1 of 4 handled");
    expect(el.querySelector<HTMLElement>('.ui-cpr__seg[data-state="reviewed"]')!.style.width).toBe("25%");
  });

  test("Review, Mark superseded and Dismiss fire their events and a cancelable tc-states-change – nothing else changes", async () => {
    const el = await make();
    const log: string[] = [];
    for (const name of ["tc-review", "tc-supersede", "tc-dismiss"]) el.addEventListener(name, (e) => log.push(`${name}:${(e as CustomEvent).detail.id}`));
    el.addEventListener("tc-states-change", (e) => log.push(`states:${(e as CustomEvent).detail.id}=${(e as CustomEvent).detail.state}`));
    btn(el, "a1", "review")!.click();
    await settle();
    btn(el, "p1", "supersede")!.click();
    await settle();
    btn(el, "a2", "dismiss")!.click();
    await settle();
    expect(log).toEqual(["tc-review:a1", "states:a1=reviewed", "tc-supersede:p1", "states:p1=superseded", "tc-dismiss:a2", "states:a2=dismissed"]);
    expect(el.states).toEqual({ a1: "reviewed", p1: "superseded", a2: "dismissed" });
    expect(row(el, "p1").dataset.state).toBe("superseded");
    expect(plain(el.querySelector(".ui-cpr__progress-text")!.textContent)).toBe("4 of 4 handledAll handled");
    expect(status(el)).toBe("Dismissed: Board slide. Every item is handled.");
    // The candidates themselves are never touched
    expect(LIST.map((c) => c.title)).toEqual(["Q3 report", "Risk memo", "Board slide", "Team FAQ"]);
    expect(LIST[1].state).toBeUndefined();
  });

  test("Undo puts an item back to pending", async () => {
    const el = await make({ states: { a1: "superseded" } });
    expect(btn(el, "a1", "undo")!.getAttribute("aria-label")).toBe("Undo: superseded – Risk memo");
    btn(el, "a1", "undo")!.click();
    await settle();
    expect(el.states.a1).toBe("pending");
    expect(btn(el, "a1", "review")).not.toBeNull();
    expect(status(el)).toBe("Back to pending: Risk memo.");
  });

  test("controlled: preventDefault() keeps the states as they are (the action events still fire)", async () => {
    const el = await make();
    let reviews = 0;
    el.addEventListener("tc-review", () => reviews++);
    el.addEventListener("tc-states-change", (e) => e.preventDefault());
    btn(el, "a1", "review")!.click();
    await settle();
    expect(reviews).toBe(1);
    expect(el.states).toEqual({});
    expect(row(el, "a1").dataset.state).toBe("pending");
  });

  test("focus: after an action it lands on the row's Undo, after Undo on its Review", async () => {
    const el = await make();
    const review = btn(el, "a1", "review")!;
    review.focus();
    review.click();
    await settle();
    expect(document.activeElement).toBe(btn(el, "a1", "undo"));
    btn(el, "a1", "undo")!.click();
    await settle();
    expect(document.activeElement).toBe(btn(el, "a1", "review"));
  });

  test("names: actions are described by the item; Dismiss says why", async () => {
    const el = await make();
    const review = btn(el, "a1", "review")!;
    expect(document.getElementById(review.getAttribute("aria-describedby")!)!.textContent).toBe("Risk memo");
    expect(btn(el, "a1", "dismiss")!.getAttribute("aria-label")).toBe("Dismiss: Risk memo – it doesn't rely on the claim");
  });

  test("empty and note text are properties; without a claim the correction block goes", async () => {
    const el = await make();
    el.candidates = [];
    el.emptyText = "Nothing cites it";
    el.note = "";
    el.claim = "";
    el.correction = "";
    await settle();
    expect(el.querySelector(".ui-cpr__empty")!.textContent).toBe("Nothing cites it");
    expect(el.querySelector(".ui-cpr__note")).toBeNull();
    expect(el.querySelector(".ui-cpr__fix")).toBeNull();
    expect(el.querySelector('[role="progressbar"]')).toBeNull();
  });

  test("focus doesn't drop to the body when the focused item is removed", async () => {
    const el = await make();
    btn(el, "a2", "review")!.focus();
    el.candidates = LIST.filter((c) => c.id !== "a2");
    await settle();
    await wait(50);
    expect(el.contains(document.activeElement)).toBe(true);
  });

  test("the wrapper: uncontrolled states survive a parent re-render; callbacks fire", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(CorrectionPropagation, {
        title: `Reach ${n}`,
        candidates: LIST,
        onStatesChange: (_s, id, state) => calls.push(`${id}=${state}`),
        onReview: (id) => calls.push(`review:${id}`),
        onSupersede: (id) => calls.push(`supersede:${id}`),
        onDismiss: (id) => calls.push(`dismiss:${id}`),
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-correction-propagation")!;
    btn(el, "p1", "supersede")!.click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(el.querySelector(".ui-cpr__title")!.textContent).toBe("Reach 1");
    expect(row(el, "p1").dataset.state).toBe("superseded");
    btn(el, "a1", "dismiss")!.click();
    await act(async () => settle());
    expect(calls).toEqual(["supersede:p1", "p1=superseded", "dismiss:a1", "a1=dismissed"]);
    await act(async () => root.unmount());
  });

  test("the wrapper: controlled states", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    await act(async () => root.render(React.createElement(CorrectionPropagation, { candidates: LIST, states: {}, onStatesChange: (_s, id, state) => calls.push(`${id}=${state}`), onReview: (id) => calls.push(`review:${id}`) })));
    await settle();
    const el = host.querySelector("tc-correction-propagation")!;
    btn(el, "a1", "review")!.click();
    await act(async () => settle());
    expect(calls).toEqual(["review:a1", "a1=reviewed"]);
    expect(row(el, "a1").dataset.state).toBe("pending");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-correction-propagation heading="Standard" claim="Was" correction="Now" reason="Why" meta="Who" .candidates=${LIST} .states=${{ p1: "superseded", a1: "dismissed" }}></tc-correction-propagation>
        <tc-correction-propagation look="clean" heading="Clean" claim="Was" correction="Now" .candidates=${LIST} .states=${{ a2: "reviewed" }}></tc-correction-propagation>
        <tc-correction-propagation look="clean" heading="Empty" .candidates=${[]}></tc-correction-propagation>
      </div>`);
      await wait(600);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
