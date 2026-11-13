/*
 * <tc-quality-drop> in real browsers: what fell and the cause in words, the topics, Roll back with its confirmation
 * (focus, Escape, preventDefault), Dismiss and Undo, the one-off events, the wrapper, axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/quality-drop";
import type {
  QualityDropCause,
  QualityDropChatOpen,
  QualityDropEvidence,
  QualityDropInvestigate,
  QualityDropPoint,
  QualityDropRollback,
  QualityDropSegment,
  QualityDropStatusChange,
  TcQualityDrop,
} from "../../src/elements/quality-drop";
import { QualityDrop } from "../../src/elements/react/quality-drop";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DAY = 86_400_000;
const AT = Date.UTC(2026, 10, 3);
const SERIES: QualityDropPoint[] = Array.from({ length: 10 }, (_, i) => ({ date: AT - 5 * DAY + i * DAY, value: i < 5 ? 4.4 : 3.8 }));
const CAUSE: QualityDropCause = { change: { label: "Prompt v13 → v14", at: AT, kind: "prompt" }, confidence: "high", reason: "Went live the day scores fell." };
const EVIDENCE: QualityDropEvidence[] = [
  { id: "c1", quote: "You can claim £60 a night.", note: "The limit is £120" },
  { id: "c2", quote: "Receipts aren't needed under £50." },
];
const SEGMENTS: QualityDropSegment[] = [
  { id: "leave", label: "Leave", share: 0.27 },
  { id: "travel", label: "Travel", share: 0.46 },
];
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();
const drop = (look = "standard", extra: Partial<TcQualityDrop> = {}) =>
  fixture<TcQualityDrop>(html`<tc-quality-drop
    look=${look}
    locale="en-GB"
    criterion="Correctness"
    rollback-to="v13"
    .from=${4.4}
    .to=${3.8}
    .at=${AT}
    .chats=${1284}
    .series=${SERIES}
    .cause=${extra.cause === undefined ? CAUSE : extra.cause}
    .evidence=${EVIDENCE}
    .segments=${SEGMENTS}
    .reverts=${["The instructions go back to v13", "Chats already answered keep their answers"]}
  ></tc-quality-drop>`);
const btn = (el: Element, label: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => text(b) === label)!;

describe("tc-quality-drop", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: what fell, the cause in words, the failing chats, the topics by share, three actions`, async () => {
      const el = await drop(look);
      expect(el.dataset.ui).toBe("qdr");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("status")).toBe("open");
      expect(text(el.querySelector(".ui-qdr__headline"))).toBe("Correctness fell from 4.4 to 3.8");
      expect(text(el.querySelector(".ui-qdr__when"))).toBe("since 3 Nov · 1,284 chats scored");
      expect(text(el.querySelector(".ui-qdr__cause .ui-qdr__label"))).toBe("Likely cause");
      expect(text(el.querySelector(".ui-qdr__pill"))).toBe("High confidence");
      expect(text(el.querySelector(".ui-qdr__change"))).toBe("Prompt v13 → v14 went live 3 Nov High confidence");
      expect(el.querySelectorAll(".ui-qdr__quote")).toHaveLength(2);
      expect(text(el.querySelector(".ui-qdr__quote-btn"))).toBe("You can claim £60 a night. The limit is £120 , open chat");
      // Topics, largest share first, each in words
      expect([...el.querySelectorAll(".ui-qdr__chip")].map((c) => text(c))).toEqual(["Travel 46% of failing chats", "Leave 27% of failing chats"]);
      expect(el.querySelector(".ui-qdr__cause")!.getAttribute("aria-labelledby")).toBe(el.querySelector(".ui-qdr__cause h4")!.id);
      // The chart: drawn and hidden, with the dates and the change under it
      expect(el.querySelector(".ui-qdr__plot")!.getAttribute("aria-hidden")).toBe("true");
      expect(el.querySelectorAll(".ui-qdr__rule")).toHaveLength(2);
      expect(text(el.querySelector(".ui-qdr__chart-key"))).toBe("29 Oct Prompt v13 → v14 · 3 Nov 7 Nov");
      expect([...el.querySelectorAll(".ui-qdr__actions button")].map((b) => text(b))).toEqual(["Roll back to v13", "Investigate", "Dismiss as expected"]);
    });
  }

  test("Roll back asks first: the confirmation says what reverts, takes focus, Escape returns to Roll back", async () => {
    const el = await drop();
    btn(el, "Roll back to v13").click();
    await settle();
    const confirm = el.querySelector(".ui-qdr__confirm")!;
    expect(confirm.getAttribute("role")).toBe("group");
    expect(text(el.querySelector(`#${confirm.getAttribute("aria-labelledby")}`))).toBe("Roll back to v13?");
    expect([...confirm.querySelectorAll("li")].map((li) => text(li))).toEqual(["The instructions go back to v13", "Chats already answered keep their answers"]);
    expect(document.activeElement).toBe(confirm.querySelector(".ui-qdr__confirm-go"));
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await settle();
    expect(el.querySelector(".ui-qdr__confirm")).toBeNull();
    expect(document.activeElement).toBe(el.querySelector(".ui-qdr__rollback"));
  });

  test("confirming fires tc-rollback, then tc-status-change; the card folds and focus goes to Undo; Undo reopens", async () => {
    const el = await drop();
    const seen: unknown[] = [];
    el.addEventListener("tc-rollback", (e) => seen.push((e as CustomEvent<QualityDropRollback>).detail));
    el.addEventListener("tc-status-change", (e) => seen.push((e as CustomEvent<QualityDropStatusChange>).detail));
    // Prevented, the confirmation stays
    el.addEventListener("tc-rollback", (e) => e.preventDefault(), { once: true });
    btn(el, "Roll back to v13").click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-qdr__confirm-go")!.click();
    await settle();
    expect(el.status).toBe("open");
    expect(el.querySelector(".ui-qdr__confirm")).not.toBeNull();
    el.querySelector<HTMLButtonElement>(".ui-qdr__confirm-go")!.click();
    await settle();
    expect(el.status).toBe("rolled-back");
    expect(el.getAttribute("status")).toBe("rolled-back");
    expect(text(el.querySelector(".ui-qdr__state"))).toBe("Rolled back to v13");
    expect(el.querySelector(".ui-qdr__actions")).toBeNull();
    expect(text(el.querySelector('[role="status"]'))).toBe("Rolled back to v13");
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-qdr__undo"));
    el.querySelector<HTMLButtonElement>(".ui-qdr__undo")!.click();
    await settle();
    expect(el.status).toBe("open");
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-qdr__rollback"));
    expect(seen).toEqual([{ version: "v13" }, { version: "v13" }, { status: "rolled-back" }, { status: "open" }]);
  });

  test("Dismiss as expected folds the card; preventDefault on tc-status-change keeps it open", async () => {
    const el = await drop();
    el.addEventListener("tc-status-change", (e) => e.preventDefault(), { once: true });
    btn(el, "Dismiss as expected").click();
    await settle();
    expect(el.status).toBe("open");
    btn(el, "Dismiss as expected").click();
    await settle();
    expect(el.status).toBe("dismissed");
    expect(text(el.querySelector(".ui-qdr__state"))).toBe("Dismissed as expected");
    expect(text(el.querySelector(".ui-qdr__folded .ui-qdr__muted"))).toBe("Marked as an expected change – it won't alert again.");
  });

  test("Investigate and a quote fire their events; no cause says so; no rollback version hides Roll back", async () => {
    const el = await drop();
    const seen: unknown[] = [];
    el.addEventListener("tc-investigate", (e) => seen.push((e as CustomEvent<QualityDropInvestigate>).detail));
    el.addEventListener("tc-chat-open", (e) => seen.push((e as CustomEvent<QualityDropChatOpen>).detail.id));
    btn(el, "Investigate").click();
    el.querySelectorAll<HTMLButtonElement>(".ui-qdr__quote-btn")[1].click();
    expect(seen).toEqual([{ criterion: "Correctness" }, "c2"]);
    const bare = await fixture<TcQualityDrop>(html`<tc-quality-drop criterion="Tone" .from=${4.5} .to=${4.1} .cause=${null}></tc-quality-drop>`);
    expect(text(bare.querySelector(".ui-qdr__cause"))).toBe("Cause No change went live near the drop.");
    expect(bare.querySelector(".ui-qdr__rollback")).toBeNull();
    expect(bare.querySelector(".ui-qdr__chart")).toBeNull();
    expect(bare.querySelector(".ui-qdr__segments")).toBeNull();
  });

  test("React wrapper: a controlled status stays until the parent changes it; onRollback can refuse", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let allow = false;
    const props = {
      title: "Drop",
      criterion: "Correctness",
      from: 4.4,
      to: 3.8,
      cause: CAUSE,
      rollbackTo: "v13",
      onRollback: (v: string) => {
        seen.push(v);
        return allow;
      },
      onStatusChange: (s: string) => seen.push(s),
    } as React.ComponentProps<typeof QualityDrop>;
    await act(async () => root.render(React.createElement(QualityDrop, { ...props, status: "open" })));
    await settle();
    const el = host.querySelector("tc-quality-drop")!;
    expect(el.heading).toBe("Drop");
    btn(el, "Roll back to v13").click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-qdr__confirm-go")!.click();
    await settle();
    expect(el.status).toBe("open");
    expect(el.querySelector(".ui-qdr__confirm")).not.toBeNull();
    allow = true;
    el.querySelector<HTMLButtonElement>(".ui-qdr__confirm-go")!.click();
    await settle();
    // Controlled: asked, but the parent hasn't changed it yet
    expect(el.status).toBe("open");
    await act(async () => root.render(React.createElement(QualityDrop, { ...props, status: "rolled-back" })));
    await settle();
    expect(el.status).toBe("rolled-back");
    expect(seen).toEqual(["v13", "v13", "rolled-back"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: uncontrolled, a dismissal survives a parent re-render", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(QualityDrop, { criterion: "Tone", from: 4.5, to: 4, "data-n": n } as React.ComponentProps<typeof QualityDrop>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-quality-drop")!;
    btn(el, "Dismiss as expected").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.status).toBe("dismissed");
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme – open, confirming, rolled back, narrow", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <div style="width: 680px"><tc-quality-drop criterion="Correctness" rollback-to="v13" .from=${4.4} .to=${3.8} .at=${AT} .chats=${1284} .series=${SERIES} .cause=${CAUSE} .evidence=${EVIDENCE} .segments=${SEGMENTS}></tc-quality-drop></div>
        <div style="width: 680px"><tc-quality-drop look="clean" class="confirming" criterion="Correctness" rollback-to="v13" .from=${4.4} .to=${3.8} .series=${SERIES} .cause=${{ ...CAUSE, confidence: "medium" }} .evidence=${EVIDENCE} .reverts=${["The instructions go back to v13"]}></tc-quality-drop></div>
        <div style="width: 320px"><tc-quality-drop look="clean" status="rolled-back" criterion="Correctness" rollback-to="v13" .from=${4.4} .to=${3.8}></tc-quality-drop></div>
        <div style="width: 320px"><tc-quality-drop status="dismissed" criterion="Tone" .from=${4.5} .to=${4.1} .cause=${{ ...CAUSE, confidence: "low" }} .segments=${SEGMENTS}></tc-quality-drop></div>
      </div>`);
      btn(wrap.querySelector(".confirming")!, "Roll back to v13").click();
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
