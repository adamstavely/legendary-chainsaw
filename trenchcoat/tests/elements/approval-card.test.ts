/*
 * <tc-approval-card> in real browsers – the React component's contract and regression checks, ported. The countdown
 * tests use fake timers.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/approval-card";
import type { ApprovalDeny, ApprovalDetailsChange, ApprovalEvidenceSelect, ApprovalStatusChange, TcApprovalCard } from "../../src/elements/approval-card";
import { ApprovalCard, type ApprovalDetail } from "../../src/elements/react/approval-card";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

/** Moves fake time on in steps, letting the element update in between */
const advance = async (ms: number, step = 250) => {
  for (let t = 0; t < ms; t += step) {
    vi.advanceTimersByTime(step);
    await Promise.resolve();
    await Promise.resolve();
  }
};
/** A button by its own text (without the shortcut hint) */
const btn = (el: Element, name: string) =>
  [...el.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => [...b.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join("").trim() === name,
  );
/** Fake timeouts and intervals; animation frames stay real, so the fixtures still settle */
const fakeTimers = () => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
/** Records the card's events */
function record(el: Element) {
  const seen: [string, unknown][] = [];
  for (const name of ["tc-status-change", "tc-deny", "tc-expire", "tc-edit"]) el.addEventListener(name, (e) => seen.push([name, (e as CustomEvent).detail]));
  return seen;
}
const count = (seen: [string, unknown][], name: string) => seen.filter(([n]) => n === name).length;
const updates = async (el: TcApprovalCard) => {
  for (let i = 0; i < 3; i++) await el.updateComplete;
};

describe("tc-approval-card", () => {
  test("the host is the root and the group, named by the heading, described by the description", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" .description=${"To every customer"} risk="high"></tc-approval-card>`);
    expect(el.dataset.ui).toBe("ap");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("group");
    expect(el.dataset.status).toBe("pending");
    expect(el.dataset.actions).toBe("tray");
    expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Send campaign email");
    expect(document.getElementById(el.getAttribute("aria-describedby")!)!.textContent).toBe("To every customer");
    expect(el.querySelector(".ui-ap__risk")!.textContent).toBe("High risk");
    el.look = "clean";
    await settle();
    expect(el.dataset.actions).toBe("card");
  });

  test("controlled and left pending after the timeout: tc-expire / tc-deny fire once, not on every hover or focus", async () => {
    fakeTimers();
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" expires-in="1"></tc-approval-card>`);
    const seen = record(el);
    el.addEventListener("tc-status-change", (e) => e.preventDefault());
    await advance(1500);
    expect(count(seen, "tc-expire")).toBe(1);
    expect(seen.find(([n]) => n === "tc-deny")![1]).toEqual({ reason: "timeout" });
    expect(el.dataset.status).toBe("pending");
    for (let i = 0; i < 3; i++) {
      el.dispatchEvent(new PointerEvent("pointerenter"));
      await updates(el);
      el.dispatchEvent(new PointerEvent("pointerleave"));
      await updates(el);
      // Focus coming and going, as events (a real blur would leave focus on <body> for the rescue to pick up)
      btn(el, "Approve")!.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      await updates(el);
      btn(el, "Approve")!.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      await advance(300);
    }
    expect(count(seen, "tc-expire")).toBe(1);
    expect(count(seen, "tc-deny")).toBe(1);
    // A fresh request (the page moves it off pending and back) gets its own countdown – with focus elsewhere on the page
    const outside = document.createElement("button");
    document.body.append(outside);
    outside.focus();
    el.status = "denied";
    await updates(el);
    el.status = "pending";
    await updates(el);
    await advance(1500);
    expect(count(seen, "tc-expire")).toBe(2);
  });

  test("the countdown counts down once a second, gets low, and a re-render keeps the time left", async () => {
    fakeTimers();
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" expires-in="45"></tc-approval-card>`);
    const expires = () => el.querySelector(".ui-ap__expires")!;
    const sr = () => el.querySelector('[id$="-timer"]')!.textContent;
    await advance(4000);
    await updates(el);
    expect(expires().textContent).toContain("0:41");
    expect(sr()).toContain("Expires in 41 seconds");
    el.description = "b";
    await updates(el);
    expect(expires().textContent).toContain("0:41");
    await advance(32_000);
    await updates(el);
    expect(expires().hasAttribute("data-low")).toBe(true);
    expect(expires().textContent).toContain("0:09");
  });

  test("the countdown pauses while hovered and runs out after", async () => {
    fakeTimers();
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" expires-in="1"></tc-approval-card>`);
    const seen = record(el);
    el.dispatchEvent(new PointerEvent("pointerenter"));
    await updates(el);
    await advance(2000);
    expect(count(seen, "tc-expire")).toBe(0);
    el.dispatchEvent(new PointerEvent("pointerleave"));
    await updates(el);
    await advance(1500);
    expect(count(seen, "tc-expire")).toBe(1);
    await updates(el);
    expect(el.dataset.status).toBe("denied");
    expect(el.querySelector(".ui-ap__row-status")!.textContent).toContain("Expired");
  });

  test("Escape anywhere in the card denies; Escape in the preview content or a field doesn't", async () => {
    const field = document.createElement("input");
    field.setAttribute("aria-label", "Note");
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" .preview=${field}></tc-approval-card>`);
    const seen = record(el);
    key(el.querySelector('input[aria-label="Note"]')!, "Escape");
    expect(count(seen, "tc-deny")).toBe(0);
    key(el.querySelector('input[type="checkbox"]')!, "Escape");
    expect(seen.find(([n]) => n === "tc-deny")![1]).toEqual({ reason: "user" });
  });

  test("an approval that settles after removal sets nothing", async () => {
    let resolve!: () => void;
    let calls = 0;
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" .onApprove=${() => (calls++, new Promise<void>((r) => (resolve = r)))}></tc-approval-card>`);
    const seen = record(el);
    btn(el, "Approve")!.click();
    expect(calls).toBe(1);
    el.remove();
    resolve();
    await settle();
    expect(seen).toEqual([]);
    expect(el.status).toBe("pending");
  });

  test("a rejected approval clears the spinner, shows an error and can be retried", async () => {
    let attempt = 0;
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" .onApprove=${() => (attempt++ === 0 ? Promise.reject(new Error("offline")) : Promise.resolve())}></tc-approval-card>`);
    const seen = record(el);
    btn(el, "Approve")!.click();
    await settle();
    expect(el.hasAttribute("data-busy")).toBe(false);
    expect(el.dataset.status).toBe("pending");
    expect(el.querySelector('[role="alert"]')!.textContent).toBe("Couldn't approve. Try again.");
    btn(el, "Approve")!.click();
    await settle();
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(el.dataset.status).toBe("approved");
    expect(seen).toEqual([["tc-status-change", { status: "approved" }]]);
  });

  test("a pending approval shows a spinner and locks the card", async () => {
    let resolve!: () => void;
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" .onApprove=${() => new Promise<void>((r) => (resolve = r))}></tc-approval-card>`);
    const seen = record(el);
    btn(el, "Approve")!.click();
    await settle();
    expect(el.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelector(".ui-ap__spinner")).toBeTruthy();
    btn(el, "Deny")!.click();
    expect(seen).toEqual([]);
    resolve();
    await settle();
    expect(el.dataset.status).toBe("approved");
  });

  test("controlled status: a decision is reported through tc-status-change, not applied", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email"></tc-approval-card>`);
    const changes: ApprovalStatusChange[] = [];
    el.addEventListener("tc-status-change", (e) => {
      changes.push((e as CustomEvent<ApprovalStatusChange>).detail);
      e.preventDefault();
    });
    btn(el, "Deny")!.click();
    await settle();
    expect(changes).toEqual([{ status: "denied" }]);
    expect(el.dataset.status).toBe("pending");
  });

  test("the decision time is stamped after the update, and Always shows on the row", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email"></tc-approval-card>`);
    el.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    await settle();
    btn(el, "Approve")!.click();
    await settle();
    expect(el.querySelector(".ui-ap__row-status")!.textContent!.replace(/\s+/g, " ")).toBe("Approved · Always · just now");
    expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.classList.contains("ui-ap__row-title")).toBe(true);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Approved: Send campaign email");
    const pre = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" status="approved"></tc-approval-card>`);
    await settle();
    expect(pre.textContent).toContain("just now");
  });

  test("⌘↵ / Ctrl+↵ approves; the IME composition Enter doesn't", async () => {
    let calls = 0;
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" .onApprove=${() => void calls++}></tc-approval-card>`);
    key(el, "Enter", { metaKey: true, isComposing: true });
    expect(calls).toBe(0);
    key(el, "Enter", { metaKey: true });
    expect(calls).toBe(1);
  });

  test("Edit shows with editable and fires tc-edit", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email"></tc-approval-card>`);
    expect(btn(el, "Edit")).toBeUndefined();
    el.editable = true;
    await settle();
    const seen = record(el);
    btn(el, "Edit")!.click();
    expect(seen).toEqual([["tc-edit", null]]);
  });

  test("Stop timer turns the time limit off, keeps focus in the card and the request never expires (2.2.1)", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" expires-in="2"></tc-approval-card>`);
    const seen = record(el);
    const stop = btn(el, "Stop")!;
    expect(document.getElementById(stop.getAttribute("aria-describedby")!)!.textContent).toContain("Expires in 2 seconds");
    stop.focus();
    stop.click();
    await settle();
    expect(btn(el, "Stop")).toBeUndefined();
    expect(document.activeElement).toBe(btn(el, "Approve"));
    expect(el.textContent).toContain("No time limit");
    expect(el.getAttribute("aria-describedby") ?? "").not.toMatch(/-timer/);
    (document.activeElement as HTMLElement).blur();
    fakeTimers();
    await advance(4000);
    expect(count(seen, "tc-expire")).toBe(0);
  });

  test("allow-stop-timer=false hides the control", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" expires-in="30" allow-stop-timer="false"></tc-approval-card>`);
    expect(btn(el, "Stop")).toBeUndefined();
  });

  test("the countdown pauses while focus is inside the card", async () => {
    fakeTimers();
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" expires-in="1"></tc-approval-card>`);
    const seen = record(el);
    btn(el, "Deny")!.focus();
    await updates(el);
    await advance(2000);
    expect(count(seen, "tc-expire")).toBe(0);
  });

  test("the countdown pauses while the tab is hidden", async () => {
    fakeTimers();
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" expires-in="1"></tc-approval-card>`);
    const seen = record(el);
    const spy = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    await updates(el);
    await advance(2000);
    expect(count(seen, "tc-expire")).toBe(0);
    spy.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await updates(el);
    await advance(1500);
    expect(count(seen, "tc-expire")).toBe(1);
  });

  test("a status region is there from the start and announces 20 seconds left once – not every second", async () => {
    fakeTimers();
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" expires-in="25"></tc-approval-card>`);
    const regions = [...el.querySelectorAll('[role="status"]')];
    expect(regions.length).toBe(2);
    const warn = regions[1];
    expect(warn.textContent).toBe("");
    await advance(4000);
    await updates(el);
    expect(warn.textContent).toBe("");
    await advance(1000);
    await updates(el);
    expect(warn.textContent).toContain("20 seconds left to decide: Send campaign email");
    const text = warn.textContent;
    await advance(5000);
    await updates(el);
    expect(warn.textContent).toBe(text);
  });

  test("the countdown runs on a one-second timer, not animation frames", async () => {
    fakeTimers();
    const raf = vi.spyOn(window, "requestAnimationFrame");
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email" expires-in="30"></tc-approval-card>`);
    raf.mockClear();
    await advance(3000);
    await updates(el);
    expect(raf).not.toHaveBeenCalled();
  });

  test("deciding moves focus to the resolved row, never to <body>; a new request brings it back to Approve", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send campaign email"></tc-approval-card>`);
    const deny = btn(el, "Deny")!;
    deny.focus();
    deny.click();
    await settle();
    expect(document.activeElement).not.toBe(document.body);
    expect((document.activeElement as HTMLElement).classList.contains("ui-ap__resolved")).toBe(true);
    el.status = "pending";
    await settle();
    expect(document.activeElement).toBe(btn(el, "Approve"));
  });

  test("custom icon, details and label are cloned in", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("data-mine", "");
    const strong = document.createElement("strong");
    strong.textContent = "Now";
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card
      heading="Send"
      .icon=${icon}
      .label=${"Step 4 · gmail.send"}
      .details=${[
        { label: "Subject", value: "Hello" },
        { label: "Scheduled", value: strong },
      ]}
    ></tc-approval-card>`);
    expect(el.querySelector(".tc-head__icon svg[data-mine]")).toBeTruthy();
    expect(el.querySelector(".ui-ap__label")!.textContent).toBe("Step 4 · gmail.send");
    expect(el.hasAttribute("data-label")).toBe(true);
    expect([...el.querySelectorAll(".ui-ap__detail")].map((d) => d.textContent)).toEqual(["SubjectHello", "ScheduledNow"]);
    expect(strong.isConnected).toBe(false);
  });

  test("decision detail is off by default: no why, consequences, Edit arguments or evidence", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send" .details=${[{ label: "To", value: "maya@northwind.io" }]}></tc-approval-card>`);
    expect(el.querySelector(".ui-ap__why, .ui-ap__outcomes, .ui-ap__evidence, .ui-ap__args-toggle, .ui-ap__arg")).toBeNull();
    expect(el.getAttribute("aria-describedby")).toBeNull();
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: why describes the card; consequences and evidence show`, async () => {
      const el = await fixture<TcApprovalCard>(html`<tc-approval-card
        look=${look}
        heading="Refund invoice"
        why="Refunds over $1,000 need a person – this one is $2,400."
        .consequences=${{ approve: "Harbor & Co get $2,400 back today.", deny: "Nothing is refunded; the agent tells the customer." }}
        .evidence=${[{ label: "Invoice INV-2291", detail: "PDF", href: "https://example.com/inv" }, { label: "Support thread", detail: "3 messages" }]}
      ></tc-approval-card>`);
      expect(el.querySelector(".ui-ap__why-label")!.textContent).toBe("Why you're seeing this");
      const why = el.querySelector(".ui-ap__why-text")!;
      expect(el.getAttribute("aria-describedby")!.split(" ")).toContain(why.id);
      const outcomes = [...el.querySelectorAll<HTMLElement>(".ui-ap__outcome")];
      expect(outcomes.map((o) => o.dataset.kind)).toEqual(["approve", "deny"]);
      expect(outcomes[0].textContent!.trim()).toBe("If you approveHarbor & Co get $2,400 back today.");
      const list = el.querySelector(".ui-ap__chips")!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Evidence");
      const link = list.querySelector<HTMLAnchorElement>("a.ui-ap__chip")!;
      expect(link.href).toBe("https://example.com/inv");
      expect(link.target).toBe("_blank");
      expect(link.rel).toContain("noopener");
      const seen: ApprovalEvidenceSelect[] = [];
      el.addEventListener("tc-evidence-select", (e) => seen.push((e as CustomEvent<ApprovalEvidenceSelect>).detail));
      list.querySelector<HTMLButtonElement>("button.ui-ap__chip")!.click();
      expect(seen).toEqual([{ evidence: { label: "Support thread", detail: "3 messages" }, index: 1 }]);
      // Only one consequence: only one panel; renamed labels
      el.consequences = { deny: "Nothing happens." };
      el.ifDenyLabel = "Otherwise";
      await settle();
      expect([...el.querySelectorAll(".ui-ap__outcome-label")].map((o) => o.textContent)).toEqual(["Otherwise"]);
    });
  }

  test("Edit arguments: text rows become fields; edits fire tc-details-change and are marked; Escape leaves the mode, not the card", async () => {
    const strong = document.createElement("strong");
    strong.textContent = "Now";
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card
      heading="Send"
      editable-details
      .details=${[
        { label: "To", value: "maya@northwind.io" },
        { label: "Amount", value: "$2,400", editable: false },
        { label: "When", value: strong },
      ]}
    ></tc-approval-card>`);
    const seen = record(el);
    const changes: ApprovalDetailsChange[] = [];
    el.addEventListener("tc-details-change", (e) => changes.push((e as CustomEvent<ApprovalDetailsChange>).detail));
    const toggle = el.querySelector<HTMLButtonElement>(".ui-ap__args-toggle")!;
    expect(toggle.textContent!.trim()).toBe("Edit arguments");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)!.tagName).toBe("DL");
    toggle.click();
    await settle();
    const fields = [...el.querySelectorAll<HTMLInputElement>(".ui-ap__arg")];
    // Only the editable text row
    expect(fields.map((f) => f.getAttribute("aria-label"))).toEqual(["To"]);
    expect(document.activeElement).toBe(fields[0]);
    expect(toggle.textContent!.trim()).toBe("Done");
    fields[0].value = "maya@lumen.co";
    fields[0].dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(changes[0]).toMatchObject({ index: 0, label: "To", value: "maya@lumen.co" });
    expect(changes[0].details.map((d) => d.value)).toEqual(["maya@lumen.co", "$2,400", strong]);
    expect(el.details![0].value).toBe("maya@lumen.co");
    expect(el.querySelector(".ui-ap__detail[data-edited] .ui-ap__edited")!.textContent).toBe("Edited");
    // Escape in a field: leaves the mode, keeps the edit, doesn't deny
    key(el.querySelector(".ui-ap__arg")!, "Escape");
    await settle();
    expect(el.querySelector(".ui-ap__arg")).toBeNull();
    expect(count(seen, "tc-deny")).toBe(0);
    expect(document.activeElement).toBe(el.querySelector(".ui-ap__args-toggle"));
    expect(el.querySelector(".ui-ap__detail[data-edited] dd")!.textContent).toContain("maya@lumen.co");
  });

  test("Edit arguments, controlled: preventDefault() keeps the rows", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Send" editable-details .details=${[{ label: "To", value: "maya@northwind.io" }]}></tc-approval-card>`);
    el.addEventListener("tc-details-change", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-ap__args-toggle")!.click();
    await settle();
    const field = el.querySelector<HTMLInputElement>(".ui-ap__arg")!;
    field.value = "someone@else.io";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(field.value).toBe("maya@northwind.io");
    expect(el.details![0].value).toBe("maya@northwind.io");
  });

  test("React wrapper: why, consequences, evidence and edits; uncontrolled edits survive a parent re-render", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picked: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ApprovalCard, {
        title: "Refund invoice",
        why: "Over the $1,000 limit.",
        consequences: { approve: "The refund goes out.", deny: "Nothing is refunded." },
        evidence: [{ label: "Invoice" }],
        onEvidenceSelect: (ev) => void picked.push(ev.label),
        editableDetails: true,
        details: [{ label: "Amount", value: "$2,400" }],
        "data-n": n,
      } as React.ComponentProps<typeof ApprovalCard>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-approval-card")!;
    expect(el.querySelector(".ui-ap__why-text")!.textContent).toBe("Over the $1,000 limit.");
    expect(el.querySelectorAll(".ui-ap__outcome")).toHaveLength(2);
    el.querySelector<HTMLButtonElement>("button.ui-ap__chip")!.click();
    expect(picked).toEqual(["Invoice"]);
    el.querySelector<HTMLButtonElement>(".ui-ap__args-toggle")!.click();
    await settle();
    const field = el.querySelector<HTMLInputElement>(".ui-ap__arg")!;
    field.value = "$2,000";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.querySelector<HTMLInputElement>(".ui-ap__arg")!.value).toBe("$2,000");
    await act(async () => root.unmount());
  });

  test("React wrapper: onDetailsChange controls the rows", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: ApprovalDetail[][] = [];
    await act(async () =>
      root.render(React.createElement(ApprovalCard, { title: "Refund", editableDetails: true, details: [{ label: "Amount", value: "$2,400" }], onDetailsChange: (d) => void asked.push(d) })),
    );
    await settle();
    const el = host.querySelector("tc-approval-card")!;
    el.querySelector<HTMLButtonElement>(".ui-ap__args-toggle")!.click();
    await settle();
    const field = el.querySelector<HTMLInputElement>(".ui-ap__arg")!;
    field.value = "$1";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(asked).toEqual([[{ label: "Amount", value: "$1" }]]);
    expect(field.value).toBe("$2,400");
    await act(async () => root.unmount());
  });

  test("diff and args are off by default; diff shows the path, counts, signs and screen-reader words", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Move the embargo"></tc-approval-card>`);
    expect(el.querySelector(".ui-ap__code")).toBeNull();
    el.diff = {
      path: "survey/report.config.ts",
      lines: [
        { kind: "context", text: "export const report = {" },
        { kind: "remove", text: 'embargo: "2026-11-20"' },
        { kind: "add", text: 'embargo: "2026-11-13"' },
        { kind: "add", text: "public: true" },
      ],
    };
    await settle();
    const region = el.querySelector<HTMLElement>(".ui-ap__code[data-kind='diff']")!;
    expect(region.getAttribute("role")).toBe("region");
    expect(region.tabIndex).toBe(0);
    expect(region.getAttribute("aria-label")).toBe("Changes: survey/report.config.ts");
    expect(el.querySelector(".ui-ap__path")!.textContent).toBe("survey/report.config.ts");
    expect(el.querySelector(".ui-ap__stat .tc-sr-only")!.textContent).toBe("2 added, 1 removed");
    const lines = [...el.querySelectorAll(".ui-ap__line")];
    expect(lines.map((l) => (l as HTMLElement).dataset.kind)).toEqual(["context", "remove", "add", "add"]);
    expect(lines.map((l) => l.querySelector(".ui-ap__sign")!.textContent)).toEqual([" ", "−", "+", "+"]);
    expect(lines[1].querySelector(".ui-ap__lc")!.textContent).toBe('Removed: embargo: "2026-11-20"');
    expect(lines[2].querySelector(".ui-ap__lc")!.textContent).toBe('Added: embargo: "2026-11-13"');
    expect(lines[0].querySelector(".tc-sr-only")).toBeNull();
    el.diffLabel = "File change";
    await settle();
    expect(region.getAttribute("aria-label")).toBe("File change: survey/report.config.ts");
    // An empty diff shows nothing
    el.diff = { path: "x.ts", lines: [] };
    await settle();
    expect(el.querySelector(".ui-ap__code")).toBeNull();
  });

  test("args: indented JSON with keys, strings, numbers and keywords coloured; a value JSON can't hold falls back to text", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Run the migration" .args=${{ dataset: "survey-2026", rows: 48210, dry_run: false, note: null }}></tc-approval-card>`);
    const region = el.querySelector<HTMLElement>(".ui-ap__code[data-kind='args']")!;
    expect(region.getAttribute("aria-label")).toBe("Arguments");
    const text = [...region.querySelectorAll(".ui-ap__lc")].map((l) => l.textContent).join("\n");
    expect(text).toBe(JSON.stringify({ dataset: "survey-2026", rows: 48210, dry_run: false, note: null }, null, 2));
    expect([...region.querySelectorAll(".ui-ap__t-p")].map((t) => t.textContent)).toEqual(['"dataset"', '"rows"', '"dry_run"', '"note"']);
    expect([...region.querySelectorAll(".ui-ap__t-s")].map((t) => t.textContent)).toEqual(['"survey-2026"']);
    expect([...region.querySelectorAll(".ui-ap__t-n")].map((t) => t.textContent)).toEqual(["48210"]);
    expect([...region.querySelectorAll(".ui-ap__t-k")].map((t) => t.textContent)).toEqual(["false", "null"]);
    const loop: Record<string, unknown> = { a: 1 };
    loop.self = loop;
    el.args = loop;
    await settle();
    expect(el.querySelector(".ui-ap__code[data-kind='args']")!.textContent!.trim()).toBe("[object Object]");
  });

  test("React wrapper: diff and args pass through", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () =>
      root.render(
        React.createElement(ApprovalCard, {
          title: "Move the embargo",
          diff: { path: "a.ts", lines: [{ kind: "add", text: "x" }] },
          args: { commit: true },
        }),
      ),
    );
    await settle(host);
    expect(host.querySelector(".ui-ap__code[data-kind='diff'] .ui-ap__lc")!.textContent).toBe("Added: x");
    expect(host.querySelector(".ui-ap__code[data-kind='args'] .ui-ap__t-k")!.textContent).toBe("true");
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-approval-card heading="Send campaign email" .description=${"To every customer"} risk="high" expires-in="45" .details=${[{ label: "Subject", value: "Hello" }]}></tc-approval-card>
      <tc-approval-card look="clean" heading="Delete branch" risk="low" expires-in="45" .label=${"Step 2"}></tc-approval-card>
      <tc-approval-card look="clean" heading="Merge" status="approved"></tc-approval-card>
    </div>`);
    await axeDetail(wrap);
    await Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished));
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

/** The decision detail in both looks and both themes, one card editing its arguments */
async function axeDetail(wrap: Element) {
  for (const theme of ["light", "dark"]) {
    const box = document.createElement("div");
    box.dataset.tcTheme = theme;
    box.style.cssText = "padding: 16px; background: var(--tc-surface-base)";
    for (const look of ["standard", "clean"]) {
      const card = document.createElement("tc-approval-card");
      Object.assign(card, {
        look,
        heading: "Refund invoice",
        why: "Refunds over $1,000 need a person.",
        consequences: { approve: "The refund goes out today.", deny: "Nothing is refunded." },
        evidence: [{ label: "Invoice INV-2291", detail: "PDF", href: "https://example.com" }, { label: "Support thread", detail: "3 messages" }],
        editableDetails: true,
        details: [{ label: "Amount", value: "$2,400" }, { label: "Customer", value: "Harbor & Co" }],
        diff: { path: "billing/refunds.ts", lines: [{ kind: "context", text: "const limit = {" }, { kind: "remove", text: "  max: 1000," }, { kind: "add", text: "  max: 2400," }, { kind: "context", text: "};" }] },
        args: { invoice: "INV-2291", amount: 2400, notify: true, memo: null },
      });
      box.append(card);
    }
    wrap.append(box);
  }
  await settle(wrap);
  const cards = wrap.querySelectorAll<TcApprovalCard>("[data-tc-theme] tc-approval-card");
  cards[0].querySelector<HTMLButtonElement>(".ui-ap__args-toggle")!.click();
  const field = () => cards[0].querySelector<HTMLInputElement>(".ui-ap__arg");
  await settle(wrap);
  field()!.value = "$2,000";
  field()!.dispatchEvent(new Event("input", { bubbles: true }));
  await settle(wrap);
}

// Keep the detail types in use for the type check
export type { ApprovalDeny };

describe("tc-approval-card – editable arguments", () => {
  const ARGS = { dataset: "field-survey-2026", rows: 48210, dry_run: false, tags: ["merge", "ids"], note: "Nightly batch" };
  const SCHEMA = {
    properties: {
      dataset: { type: "string" as const, enum: ["field-survey-2026", "field-survey-2025"], title: "Dataset" },
      rows: { type: "integer" as const, title: "Rows", description: "How many rows to merge" },
      dry_run: { type: "boolean" as const, title: "Dry run" },
    },
  };
  const edit = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-ap__args-edit")!;
  const field = (el: Element, key: string) => el.querySelector<HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement>(`[id$="-argform-${key}"]`)!;
  const type = async (el: TcApprovalCard, f: HTMLInputElement | HTMLTextAreaElement, value: string) => {
    f.value = value;
    f.dispatchEvent(new Event("input", { bubbles: true }));
    await updates(el);
  };

  test("off by default: no Edit, the arguments as a code block, Approve's event has only the status", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Run migration" .args=${ARGS}></tc-approval-card>`);
    expect(el.querySelector(".ui-ap__args-edit")).toBeNull();
    const seen = record(el);
    btn(el, "Approve")!.click();
    await updates(el);
    expect(seen).toEqual([["tc-status-change", { status: "approved" }]]);
  });

  test("Edit turns each argument into the field its schema or value asks for, focused first; Done turns them back", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Run migration" editable-args .args=${ARGS} .argsSchema=${SCHEMA}></tc-approval-card>`);
    expect(edit(el).textContent!.replace(/\s+/g, " ").trim()).toBe("Edit arguments");
    expect(edit(el).getAttribute("aria-expanded")).toBe("false");
    edit(el).click();
    await updates(el);
    await settle();
    expect(edit(el).getAttribute("aria-expanded")).toBe("true");
    const form = el.querySelector(".ui-ap__argform")!;
    expect(form.getAttribute("role")).toBe("group");
    expect(edit(el).getAttribute("aria-controls")).toBe(form.id);
    expect(field(el, "dataset").tagName).toBe("SELECT");
    expect([...field(el, "dataset").options].map((o) => o.value)).toEqual(["field-survey-2026", "field-survey-2025"]);
    expect(field(el, "rows").type).toBe("number");
    expect(field(el, "rows").step).toBe("1");
    expect(field(el, "dry_run").type).toBe("checkbox");
    expect(field(el, "tags").tagName).toBe("TEXTAREA");
    expect(JSON.parse(field(el, "tags").value)).toEqual(["merge", "ids"]);
    expect(field(el, "note").type).toBe("text");
    // Labels: the schema's title with the key, else the key; the description describes the field
    const rowsLabel = el.querySelector<HTMLLabelElement>(`label[for="${field(el, "rows").id}"]`)!;
    expect(rowsLabel.textContent!.replace(/\s+/g, " ").trim()).toBe("Rows rows");
    expect(document.getElementById(field(el, "rows").getAttribute("aria-describedby")!)!.textContent).toBe("How many rows to merge");
    expect(document.activeElement).toBe(field(el, "dataset"));
    edit(el).click();
    await updates(el);
    expect(el.querySelector(".ui-ap__argform")).toBeNull();
    expect(el.querySelector('.ui-ap__code[data-kind="args"]')).not.toBeNull();
  });

  test("changes are marked, shown as a diff, and Approve with changes sends the edited args with edited: true", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Run migration" editable-args .args=${ARGS} .argsSchema=${SCHEMA}></tc-approval-card>`);
    const decisions: unknown[] = [];
    el.onApprove = (d) => void decisions.push(d);
    edit(el).click();
    await updates(el);
    await type(el, field(el, "rows"), "1000");
    field(el, "dry_run").click();
    await updates(el);
    const sel = field(el, "dataset");
    sel.value = "field-survey-2025";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    await updates(el);
    expect(el.querySelectorAll(".ui-ap__argrow[data-edited]")).toHaveLength(3);
    expect([...el.querySelectorAll(".ui-ap__argrow[data-edited] .ui-ap__edited")].map((e) => e.textContent)).toEqual(["Edited", "Edited", "Edited"]);
    // Typing it back to the original is no longer a change
    await type(el, field(el, "rows"), "48210");
    expect(el.querySelectorAll(".ui-ap__argrow[data-edited]")).toHaveLength(2);
    await type(el, field(el, "rows"), "1000");
    const diff = el.querySelector(".ui-ap__argdiff .ui-ap__code")!;
    expect(diff.getAttribute("aria-label")).toBe("Your changes: arguments");
    const lines = [...diff.querySelectorAll(".ui-ap__line")].map((l) => `${l.getAttribute("data-kind")} ${l.querySelector(".ui-ap__lc")!.textContent}`);
    expect(lines).toEqual([
      "remove Removed: dataset: \"field-survey-2026\"",
      "add Added: dataset: \"field-survey-2025\"",
      "remove Removed: rows: 48210",
      "add Added: rows: 1000",
      "remove Removed: dry_run: false",
      "add Added: dry_run: true",
    ]);
    expect(el.editedArgs).toEqual({ ...ARGS, rows: 1000, dry_run: true, dataset: "field-survey-2025" });
    expect(el.argsEdited).toBe(true);
    const approve = el.querySelector<HTMLButtonElement>(".ui-ap__approve")!;
    expect([...approve.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join("").trim()).toBe("Approve with changes");
    const seen = record(el);
    approve.click();
    await updates(el);
    expect(decisions).toEqual([{ always: false, args: { ...ARGS, rows: 1000, dry_run: true, dataset: "field-survey-2025" }, edited: true }]);
    expect(seen).toEqual([["tc-status-change", { status: "approved", args: { ...ARGS, rows: 1000, dry_run: true, dataset: "field-survey-2025" }, edited: true }]]);
  });

  test("unchanged: Approve keeps its label and sends the original args with edited: false", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Run migration" editable-args .args=${ARGS}></tc-approval-card>`);
    const seen = record(el);
    btn(el, "Approve")!.click();
    await updates(el);
    expect(seen).toEqual([["tc-status-change", { status: "approved", args: ARGS, edited: false }]]);
  });

  test("JSON fields are checked as typed: invalid holds Approve back and focuses the field; Reset puts everything back", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Run migration" editable-args .args=${ARGS}></tc-approval-card>`);
    edit(el).click();
    await updates(el);
    const tags = field(el, "tags");
    await type(el, tags, '["merge", ');
    expect(tags.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(tags.getAttribute("aria-describedby")!.split(" ")[0])!.textContent).toBe("Not valid JSON yet");
    const seen = record(el);
    el.querySelector<HTMLButtonElement>(".ui-ap__approve")!.click();
    await updates(el);
    await settle();
    expect(seen).toEqual([]);
    expect(el.status).toBe("pending");
    expect(document.activeElement).toBe(field(el, "tags"));
    expect(el.querySelector(".ui-ap__sr[role=status], [role=status]")?.textContent ?? "").toContain("Fix tags before approving");
    await type(el, field(el, "tags"), '["merge"]');
    expect(field(el, "tags").getAttribute("aria-invalid")).toBe("false");
    expect(el.editedArgs!.tags).toEqual(["merge"]);
    const reset = el.querySelector<HTMLButtonElement>(".ui-ap__args-reset")!;
    expect(reset.textContent!.trim()).toBe("Reset");
    reset.click();
    await updates(el);
    expect(el.argsEdited).toBe(false);
    expect(el.querySelector(".ui-ap__args-reset")).toBeNull();
    expect(JSON.parse(field(el, "tags").value)).toEqual(["merge", "ids"]);
  });

  test("Escape in an argument field leaves editing, keeps the changes and doesn't deny; new args start over", async () => {
    const el = await fixture<TcApprovalCard>(html`<tc-approval-card heading="Run migration" editable-args .args=${ARGS}></tc-approval-card>`);
    const seen = record(el);
    edit(el).click();
    await updates(el);
    await type(el, field(el, "note"), "Weekly batch");
    field(el, "note").focus();
    key(field(el, "note"), "Escape");
    await updates(el);
    await settle();
    expect(seen).toEqual([]);
    expect(el.querySelector(".ui-ap__argform")).toBeNull();
    expect(document.activeElement).toBe(edit(el));
    expect(el.editedArgs!.note).toBe("Weekly batch");
    // The changed block shows the edited value
    expect(el.querySelector('.ui-ap__code[data-kind="args"]')!.textContent).toContain("Weekly batch");
    el.args = { ...ARGS, rows: 10 };
    await updates(el);
    expect(el.argsEdited).toBe(false);
    expect(el.querySelector(".ui-ap__argdiff")).toBeNull();
  });

  test("React: onStatusChange gets the approved args and whether they were edited", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const calls: unknown[][] = [];
    await act(async () =>
      root.render(
        React.createElement(ApprovalCard, {
          title: "Run migration",
          args: ARGS,
          editableArgs: true,
          argsSchema: SCHEMA,
          onStatusChange: (...a: unknown[]) => void calls.push(a),
        }),
      ),
    );
    const el = host.querySelector<TcApprovalCard>("tc-approval-card")!;
    await settle(host);
    edit(el).click();
    await updates(el);
    await type(el, field(el, "rows"), "500");
    // A parent re-render doesn't undo the edit
    await act(async () =>
      root.render(
        React.createElement(ApprovalCard, {
          title: "Run migration",
          args: ARGS,
          editableArgs: true,
          argsSchema: SCHEMA,
          onStatusChange: (...a: unknown[]) => void calls.push(a),
        }),
      ),
    );
    expect(el.editedArgs!.rows).toBe(500);
    el.querySelector<HTMLButtonElement>(".ui-ap__approve")!.click();
    await updates(el);
    expect(calls).toEqual([["approved", { args: { ...ARGS, rows: 500 }, edited: true }]]);
    await act(async () => root.unmount());
  });

  test("axe: editing arguments, with a change and an invalid field, in both looks and both themes", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    for (const theme of ["light", "dark"]) {
      const box = document.createElement("div");
      box.dataset.tcTheme = theme;
      box.style.cssText = "padding: 16px; background: var(--tc-surface-base)";
      for (const look of ["standard", "clean"]) {
        const card = document.createElement("tc-approval-card");
        Object.assign(card, { look, heading: "Run migration", editableArgs: true, args: ARGS, argsSchema: SCHEMA });
        box.append(card);
      }
      wrap.append(box);
    }
    await settle(wrap);
    const cards = [...wrap.querySelectorAll<TcApprovalCard>("tc-approval-card")];
    for (const [i, card] of cards.entries()) {
      edit(card).click();
      await updates(card);
      await type(card, field(card, "rows"), "1000");
      if (i % 2) await type(card, field(card, "tags"), "[oops");
      else {
        // One card shows the code block with its diff
        edit(card).click();
        await updates(card);
      }
    }
    await settle(wrap);
    await Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished));
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
