/*
 * <tc-verification-queue> in real browsers – statuses and counts, filters, the listbox keys and single-key marks, the
 * mark toolbar, the export gate, controlled use, windowing with 10,000 claims, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/verification-queue";
import type { ClaimSource } from "../../src/elements/claim-answer";
import type {
  TcVerificationQueue,
  VerificationClaim,
  VerificationClaimsChange,
  VerificationExportDetail,
  VerificationFilterChange,
  VerificationReviewDetail,
} from "../../src/elements/verification-queue";
import { VerificationQueue } from "../../src/elements/react/verification-queue";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.parse("2026-10-24T12:00:00Z");
const SOURCES: ClaimSource[] = [
  { id: "s1", site: "Freight quote", title: "Carrier quote", quote: "Per-order cost $6.42", validity: { observed: NOW - 160 * 86_400_000, contested: true } },
];
const CLAIMS: VerificationClaim[] = [
  { id: "a", text: "Costs rise 4%.", source: "grounded", confidence: 0.86, sources: ["s1"], origin: "Answer 1" },
  { id: "b", text: "Delivery is a day faster.", source: "grounded", status: "verified" },
  { id: "c", text: "Repeat purchases go up.", source: "model", confidence: 0.6 },
  { id: "d", text: "It pays back in two years.", source: "inferred", status: "incorrect" },
  { id: "e", text: "Fuel decides it.", source: "model" },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-vq__row")];
const ids = (el: Element) => rows(el).map((r) => r.dataset.id);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-vq__row[data-id="${id}"]`)!;
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const make = (attrs = html``) =>
  fixture<TcVerificationQueue>(html`<tc-verification-queue .claims=${CLAIMS} .sources=${SOURCES} .now=${NOW}>${attrs}</tc-verification-queue>`);

describe("tc-verification-queue", () => {
  test("the host is the root and a region named by the heading; the head counts what's reviewed", async () => {
    const el = await make();
    expect(el.dataset.ui).toBe("vq");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Verification queue");
    expect(text(el.querySelector(".ui-vq__progress-text"))).toBe("2 of 5 reviewed");
    const bar = el.querySelector<HTMLElement>(".ui-vq__progress")!;
    expect(bar.getAttribute("role")).toBe("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("40");
    expect(el.counts).toEqual({ pending: 3, verified: 1, unverifiable: 0, incorrect: 1, dismissed: 0 });
    el.heading = "Claims to check";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Claims to check");
  });

  test("the list is a listbox of the claims still to review; each says its status and source type", async () => {
    const el = await make();
    const list = el.querySelector(".ui-vq__rows")!;
    expect(list.getAttribute("role")).toBe("listbox");
    expect(ids(el)).toEqual(["a", "c", "e"]);
    const first = row(el, "a");
    expect(first.getAttribute("role")).toBe("option");
    expect(first.getAttribute("aria-selected")).toBe("true");
    expect(first.getAttribute("aria-setsize")).toBe("3");
    expect(first.getAttribute("aria-posinset")).toBe("1");
    expect(text(first)).toBe("Costs rise 4%. Answer 1 , To review, Sourced");
    expect(rows(el).map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });

  test("filters: a cancelable tc-filter-change, counts on each button", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-filter-change", (e) => seen.push((e as CustomEvent<VerificationFilterChange>).detail.filter));
    const buttons = [...el.querySelectorAll<HTMLButtonElement>(".ui-vq__filter")];
    expect(buttons.map(text)).toEqual(["To review3", "Reviewed2", "All5"]);
    buttons[1].click();
    await settle();
    expect(el.filter).toBe("reviewed");
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
    expect(ids(el)).toEqual(["b", "d"]);
    buttons[2].click();
    await settle();
    expect(ids(el)).toEqual(["a", "b", "c", "d", "e"]);
    expect(seen).toEqual(["reviewed", "all"]);
    el.addEventListener("tc-filter-change", (e) => e.preventDefault());
    buttons[0].click();
    await settle();
    expect(el.filter).toBe("all");
  });

  test("the detail shows the claim you're on: type, confidence, origin, status and its passage with freshness", async () => {
    const el = await make();
    const detail = el.querySelector(".ui-vq__detail")!;
    expect(text(detail.querySelector(".ui-vq__type"))).toBe("Sourced");
    expect(text(detail.querySelector(".ui-vq__claim"))).toBe("Costs rise 4%.");
    expect(text(detail.querySelector(".ui-vq__now"))).toBe("To review");
    expect(text(detail.querySelector(".ui-vq__quote"))).toBe("Per-order cost $6.42");
    const badge = detail.querySelector<HTMLElement & { currentBand: string }>("tc-validity-badge")!;
    expect(badge.currentBand).toBe("aging");
    row(el, "c").click();
    await settle();
    expect(text(el.querySelector(".ui-vq__claim"))).toBe("Repeat purchases go up.");
    expect(text(el.querySelector(".ui-vq__detail .ui-vq__note"))).toBe("No source passage – check it against your own sources.");
    expect(document.activeElement).toBe(row(el, "c"));
  });

  test("marking from the toolbar: claims change, tc-review fires, the button is pressed; pressing it again puts it back", async () => {
    const el = await make();
    const changes: VerificationClaimsChange[] = [];
    const reviews: VerificationReviewDetail[] = [];
    el.addEventListener("tc-claims-change", (e) => changes.push((e as CustomEvent<VerificationClaimsChange>).detail));
    el.addEventListener("tc-review", (e) => reviews.push((e as CustomEvent<VerificationReviewDetail>).detail));
    el.filter = "all";
    await settle();
    const marks = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-vq__mark")];
    expect(marks().map(text)).toEqual(["VerifiedV", "Can't verifyC", "IncorrectX", "DismissD"]);
    expect(el.querySelector(".ui-vq__marks")!.getAttribute("role")).toBe("toolbar");
    marks()[0].click();
    await settle();
    expect(changes[0].status).toBe("verified");
    expect(changes[0].claims.find((c) => c.id === "a")!.status).toBe("verified");
    expect(reviews[0]).toMatchObject({ status: "verified", previous: "pending" });
    expect(el.claims[0].status).toBe("verified");
    expect(marks()[0].getAttribute("aria-pressed")).toBe("true");
    expect(text(el.querySelector('[role="status"]'))).toBe("Verified externally: Costs rise 4%. – 3 of 5 reviewed");
    marks()[0].click();
    await settle();
    expect(el.claims[0].status).toBe("pending");
    expect(reviews[1]).toMatchObject({ status: "pending", previous: "verified" });
  });

  test("the toolbar is one tab stop with arrow keys", async () => {
    const el = await make();
    const marks = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-vq__mark")];
    expect(marks().map((m) => m.tabIndex)).toEqual([0, -1, -1, -1]);
    marks()[0].focus();
    await key(marks()[0], "ArrowRight");
    expect(document.activeElement).toBe(marks()[1]);
    await key(marks()[1], "End");
    expect(document.activeElement).toBe(marks()[3]);
    await key(marks()[3], "ArrowRight");
    expect(document.activeElement).toBe(marks()[0]);
  });

  test("controlled: preventDefault keeps `claims`, and tc-review still fires", async () => {
    const el = await make();
    const reviews: string[] = [];
    el.addEventListener("tc-claims-change", (e) => e.preventDefault());
    el.addEventListener("tc-review", (e) => reviews.push((e as CustomEvent<VerificationReviewDetail>).detail.status));
    el.querySelector<HTMLButtonElement>(".ui-vq__mark")!.click();
    await settle();
    expect(el.claims).toBe(CLAIMS);
    expect(reviews).toEqual(["verified"]);
  });

  test("keyboard: arrows Home End move the tab stop; single keys mark and move on", async () => {
    const el = await make();
    el.filter = "all";
    await settle();
    row(el, "a").focus();
    await key(row(el, "a"), "ArrowDown");
    expect(document.activeElement).toBe(row(el, "b"));
    expect(row(el, "b").getAttribute("aria-selected")).toBe("true");
    await key(row(el, "b"), "End");
    expect(document.activeElement).toBe(row(el, "e"));
    await key(row(el, "e"), "ArrowDown");
    expect(document.activeElement).toBe(row(el, "e"));
    await key(row(el, "e"), "Home");
    expect(document.activeElement).toBe(row(el, "a"));
    await key(row(el, "a"), "PageDown");
    expect(document.activeElement).toBe(row(el, "e"));
    await key(row(el, "e"), "PageUp");
    expect(document.activeElement).toBe(row(el, "a"));
    // V marks it verified and moves to the next claim
    await key(row(el, "a"), "v");
    expect(el.claims.find((c) => c.id === "a")!.status).toBe("verified");
    expect(document.activeElement).toBe(row(el, "b"));
    await key(row(el, "b"), "x");
    expect(el.claims.find((c) => c.id === "b")!.status).toBe("incorrect");
    await key(row(el, "c"), "c");
    expect(el.claims.find((c) => c.id === "c")!.status).toBe("unverifiable");
    await key(row(el, "d"), "d");
    expect(el.claims.find((c) => c.id === "d")!.status).toBe("dismissed");
    // U puts one back
    await key(row(el, "e"), "ArrowUp");
    await key(row(el, "d"), "u");
    expect(el.claims.find((c) => c.id === "d")!.status).toBe("pending");
    // Modifier keys and Shift are left alone
    await key(row(el, "e"), "v", { ctrlKey: true });
    expect(el.claims.find((c) => c.id === "e")!.status ?? "pending").toBe("pending");
  });

  test("in To review, a marked claim leaves the list and focus goes to the one now in its place", async () => {
    const el = await make();
    row(el, "a").focus();
    await key(row(el, "a"), "v");
    expect(ids(el)).toEqual(["c", "e"]);
    expect(document.activeElement).toBe(row(el, "c"));
    await key(row(el, "c"), "End");
    await key(row(el, "e"), "d");
    expect(ids(el)).toEqual(["c"]);
    expect(document.activeElement).toBe(row(el, "c"));
    await key(row(el, "c"), "c");
    expect(ids(el)).toEqual([]);
    expect(text(el.querySelector(".ui-vq__empty"))).toBe("Every claim is reviewed.");
    // Focus didn't drop to <body>
    expect(el.contains(document.activeElement)).toBe(true);
  });

  test("shortcuts can be turned off", async () => {
    const el = await fixture<TcVerificationQueue>(html`<tc-verification-queue .claims=${CLAIMS} .shortcuts=${false}></tc-verification-queue>`);
    row(el, "a").focus();
    await key(row(el, "a"), "v");
    expect(el.claims[0].status).toBeUndefined();
    expect(el.querySelector(".ui-vq__kbd")).toBeNull();
  });

  test("the export gate: blocked until every claim is reviewed – it says why and takes you to the first one", async () => {
    const el = await make();
    const exported: VerificationExportDetail[] = [];
    el.addEventListener("tc-export", (e) => exported.push((e as CustomEvent<VerificationExportDetail>).detail));
    const btn = () => el.querySelector<HTMLButtonElement>(".ui-vq__export")!;
    expect(el.exportReady).toBe(false);
    expect(btn().getAttribute("aria-disabled")).toBe("true");
    expect(text(el.querySelector(`#${btn().getAttribute("aria-describedby")}`))).toBe("Review 3 more claims to export");
    el.filter = "reviewed";
    await settle();
    btn().click();
    await settle();
    expect(exported).toEqual([]);
    expect(text(el.querySelector('[role="status"]'))).toBe("Review 3 more claims before exporting.");
    expect(el.filter).toBe("open");
    expect(document.activeElement).toBe(row(el, "a"));
    // Mark the rest: the gate opens
    for (const id of ["a", "c", "e"]) {
      await key(row(el, id), "v");
    }
    expect(el.exportReady).toBe(true);
    expect(btn().getAttribute("aria-disabled")).toBe("false");
    expect(text(el.querySelector(".ui-vq__gate"))).toBe("All reviewed – 4 verified externally, 1 incorrect");
    btn().click();
    await settle();
    expect(exported).toHaveLength(1);
    expect(exported[0].counts).toEqual({ pending: 0, verified: 4, unverifiable: 0, incorrect: 1, dismissed: 0 });
    expect(exported[0].claims).toHaveLength(5);
  });

  test("allow-unreviewed lets the export through with claims left", async () => {
    const el = await fixture<TcVerificationQueue>(html`<tc-verification-queue allow-unreviewed="3" .claims=${CLAIMS}></tc-verification-queue>`);
    expect(el.exportReady).toBe(true);
    expect(text(el.querySelector(".ui-vq__gate"))).toBe("Ready – 3 left unreviewed");
  });

  test("an empty queue: nothing to export, and it says where claims come from", async () => {
    const el = await fixture<TcVerificationQueue>(html`<tc-verification-queue></tc-verification-queue>`);
    expect(el.exportReady).toBe(false);
    expect(text(el.querySelector(".ui-vq__empty"))).toBe("Nothing to verify yet – claims sent from an answer show up here.");
    expect(text(el.querySelector(".ui-vq__gate"))).toBe("Nothing to export yet");
    expect(el.querySelector(".ui-vq__detail")).toBeNull();
  });

  test("labels are properties: statuses, actions and source types", async () => {
    const el = await fixture<TcVerificationQueue>(html`<tc-verification-queue
      .claims=${CLAIMS}
      .statusLabels=${{ pending: "Open", verified: "Confirmed" }}
      .actionLabels=${{ verified: "Confirm" }}
      .sourceLabels=${{ grounded: "GRND" }}
      export-label="Release"
    ></tc-verification-queue>`);
    expect(text(el.querySelector(".ui-vq__now"))).toBe("Open");
    expect(text(el.querySelector(".ui-vq__mark"))).toBe("ConfirmV");
    expect(text(el.querySelector(".ui-vq__type"))).toBe("GRND");
    expect(text(el.querySelector(".ui-vq__export"))).toBe("Release");
  });

  test("windowing: 10,000 claims render only the rows near the viewport; End reaches the last", async () => {
    const many: VerificationClaim[] = Array.from({ length: 10_000 }, (_, i) => ({ id: `m${i}`, text: `Claim ${i}`, source: "model" }));
    const el = await fixture<TcVerificationQueue>(html`<tc-verification-queue .claims=${many}></tc-verification-queue>`);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await settle();
    expect(rows(el).length).toBeLessThan(200);
    expect(rows(el)[0].getAttribute("aria-setsize")).toBe("10000");
    const list = el.querySelector<HTMLElement>(".ui-vq__rows")!;
    expect(list.scrollHeight).toBeGreaterThan(10_000 * 30);
    row(el, "m0").focus();
    await key(row(el, "m0"), "End");
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await settle();
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await settle();
    expect((document.activeElement as HTMLElement).dataset.id).toBe("m9999");
    expect(rows(el).length).toBeLessThan(200);
    await key(document.activeElement!, "v");
    expect(el.claims[9999].status).toBe("verified");
  });

  test("clean: one card", async () => {
    const el = await fixture<TcVerificationQueue>(html`<tc-verification-queue look="clean" .claims=${CLAIMS}></tc-verification-queue>`);
    expect(el.querySelector(".ui-vq__body")).toBeTruthy();
    expect(el.querySelector(".ui-vq__card")).toBeNull();
  });

  test("React: controlled claims survive a parent re-render; onReview and onExport fire", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const reviewed: string[] = [];
    let exported = 0;
    let rerender: (n: number) => void = () => {};
    function App() {
      const [claims, setClaims] = React.useState(CLAIMS);
      const [n, set] = React.useState(0);
      rerender = set;
      return React.createElement(VerificationQueue, {
        "data-n": n,
        title: "Session claims",
        claims,
        onClaimsChange: setClaims,
        allowUnreviewed: 2,
        onReview: (c, s) => reviewed.push(`${c.id}:${s}`),
        onExport: () => exported++,
      } as React.ComponentProps<typeof VerificationQueue>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcVerificationQueue>("tc-verification-queue")!;
    expect(el.getAttribute("aria-label")).toBe("Session claims");
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-vq__mark")!.click());
    await settle();
    expect(reviewed).toEqual(["a:verified"]);
    expect(el.claims.find((c) => c.id === "a")!.status).toBe("verified");
    await act(async () => rerender(1));
    await settle();
    expect(el.claims.find((c) => c.id === "a")!.status).toBe("verified");
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-vq__export")!.click());
    expect(exported).toBe(1);
    await act(async () => root.unmount());
  });

  test("React uncontrolled: defaultClaims and the filter keep the element's changes across parent renders", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, set] = React.useState(0);
      rerender = set;
      return React.createElement(VerificationQueue, { "data-n": n, defaultClaims: CLAIMS } as React.ComponentProps<typeof VerificationQueue>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcVerificationQueue>("tc-verification-queue")!;
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-vq__mark")!.click());
    await act(async () => el.querySelectorAll<HTMLButtonElement>(".ui-vq__filter")[2].click());
    await act(async () => rerender(1));
    await settle();
    expect(el.claims.find((c) => c.id === "a")!.status).toBe("verified");
    expect(el.filter).toBe("all");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"])
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="background: ${theme === "dark" ? "#0e0e10" : "#fff"}; padding: 8px">
        <tc-verification-queue .claims=${CLAIMS} .sources=${SOURCES} .now=${NOW}></tc-verification-queue>
        <tc-verification-queue look="clean" heading="Clean queue" filter="all" .claims=${CLAIMS} .sources=${SOURCES} .now=${NOW}></tc-verification-queue>
        <tc-verification-queue look="clean" heading="Empty queue"></tc-verification-queue>
      </div>`);
      const [, clean] = [...wrap.querySelectorAll<TcVerificationQueue>("tc-verification-queue")];
      row(clean, "b").click();
      await settle();
      await Promise.all(document.getAnimations().map((x) => (x.finish(), x.finished)));
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
});

describe("tc-verification-queue – verdicts per source type", () => {
  const VERDICTS: TcVerificationQueue["verdicts"] = {
    transcript: [
      { id: "matches", label: "Matches the recording", status: "verified" },
      { id: "misheard", label: "Transcript misheard", status: "incorrect" },
      { id: "dismiss", label: "Dismiss", status: "dismissed" },
    ],
    ocr: [
      { id: "matches", label: "Matches the original", status: "verified" },
      { id: "misread", label: "OCR misread", status: "incorrect" },
      { id: "misrepresents", label: "Misrepresents source", status: "incorrect", key: "m" },
    ],
  };
  const MEDIA: VerificationClaim[] = [
    { id: "t", text: "The bays are done by January.", source: "transcript", recognition: 0.91, confidence: 0.8 },
    { id: "o", text: "We move in on 1 February.", source: "ocr", recognition: 0.72 },
    { id: "g", text: "Costs rise 4%.", source: "grounded" },
    { id: "w", text: "Fit-out ran late last time.", source: "session", status: "incorrect" },
  ];
  const queue = () => fixture<TcVerificationQueue>(html`<tc-verification-queue .claims=${MEDIA} .verdicts=${VERDICTS} filter="all"></tc-verification-queue>`);
  const marks = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-vq__mark")];

  test("a type with its own verdicts shows them, with their keys; the other types keep the four marks", async () => {
    const el = await queue();
    expect(marks(el).map((b) => text(b))).toEqual(["Matches the recordingV", "Transcript misheardX", "DismissD"]);
    expect(marks(el).map((b) => b.dataset.status)).toEqual(["verified", "incorrect", "dismissed"]);
    // The type's pill says how well the medium was read
    expect(text(el.querySelector(".ui-vq__type"))).toBe("Transcript91%");
    // OCR: the first incorrect verdict takes X; one with its own key keeps it
    row(el, "o").click();
    await settle();
    expect(marks(el).map((b) => text(b))).toEqual(["Matches the originalV", "OCR misreadX", "Misrepresents sourceM"]);
    expect(marks(el).map((b) => b.getAttribute("aria-keyshortcuts"))).toEqual(["V", "X", "M"]);
    // Sourced: no verdicts of its own – the four marks
    row(el, "g").click();
    await settle();
    expect(marks(el).map((b) => text(b))).toEqual(["VerifiedV", "Can't verifyC", "IncorrectX", "DismissD"]);
    // A memory type (no verdicts set) shows the four marks too, with its line
    row(el, "w").click();
    await settle();
    expect(marks(el)).toHaveLength(4);
    expect(row(el, "w").querySelector(".ui-vq__swatch path")!.getAttribute("data-line")).toBe("wavy");
  });

  test("giving a verdict: the claim keeps its id, counts under its status, and the events carry it", async () => {
    const el = await queue();
    row(el, "o").click();
    await settle();
    const changes: VerificationClaimsChange[] = [];
    const reviews: VerificationReviewDetail[] = [];
    el.addEventListener("tc-claims-change", (e) => changes.push((e as CustomEvent<VerificationClaimsChange>).detail));
    el.addEventListener("tc-review", (e) => reviews.push((e as CustomEvent<VerificationReviewDetail>).detail));
    marks(el)[2].click();
    await settle();
    const claim = el.claims.find((c) => c.id === "o")!;
    expect(claim.status).toBe("incorrect");
    expect(claim.verdict).toBe("misrepresents");
    expect(changes[0].verdict?.label).toBe("Misrepresents source");
    expect(reviews[0]).toMatchObject({ status: "incorrect", previous: "pending", verdict: { id: "misrepresents" } });
    expect(el.counts.incorrect).toBe(2);
    // Only the verdict given is pressed – not the other one with the same status
    expect(marks(el).map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "false", "true"]);
    expect(text(el.querySelector(".ui-vq__now"))).toBe("Misrepresents source");
    expect(text(row(el, "o").querySelector(".tc-sr-only"))).toBe(", Misrepresents source, OCR");
    expect(text(el.querySelector('[role="status"]'))).toBe("Misrepresents source: We move in on 1 February. – 2 of 4 reviewed");
    // Another verdict of the same status is a change
    marks(el)[1].click();
    await settle();
    expect(el.claims.find((c) => c.id === "o")!.verdict).toBe("misread");
    expect(reviews[1]).toMatchObject({ status: "incorrect", previous: "incorrect", verdict: { id: "misread" } });
    // Pressing the given one puts the claim back, and the verdict goes
    marks(el)[1].click();
    await settle();
    const back = el.claims.find((c) => c.id === "o")!;
    expect(back.status).toBe("pending");
    expect("verdict" in back).toBe(false);
  });

  test("the four marks leave no verdict on the claim", async () => {
    const el = await queue();
    row(el, "g").click();
    await settle();
    marks(el)[0].click();
    await settle();
    expect(el.claims.find((c) => c.id === "g")).toEqual({ id: "g", text: "Costs rise 4%.", source: "grounded", status: "verified" });
  });

  test("keyboard: single keys give the type's verdicts; a key it doesn't have does nothing; U puts it back", async () => {
    const el = await queue();
    const list = el.querySelector(".ui-vq__rows")!;
    await key(list, "ArrowDown");
    expect(el.querySelector(".ui-vq__row[aria-selected='true']")!.getAttribute("data-id")).toBe("o");
    await key(list, "c");
    expect(el.claims.find((c) => c.id === "o")!.status ?? "pending").toBe("pending");
    await key(list, "m");
    expect(el.claims.find((c) => c.id === "o")).toMatchObject({ status: "incorrect", verdict: "misrepresents" });
    // The tab stop moved on; go back and undo
    await key(list, "ArrowUp");
    await key(list, "u");
    expect(el.claims.find((c) => c.id === "o")!.status).toBe("pending");
    // On a transcript claim, X gives "Transcript misheard"
    await key(list, "Home");
    await key(list, "x");
    expect(el.claims.find((c) => c.id === "t")).toMatchObject({ status: "incorrect", verdict: "misheard" });
  });

  test("a claim given a verdict its type no longer offers shows its status's first option", async () => {
    const el = await fixture<TcVerificationQueue>(
      html`<tc-verification-queue filter="all" .verdicts=${VERDICTS} .claims=${[{ id: "x", text: "Old.", source: "ocr", status: "incorrect", verdict: "gone" }] as VerificationClaim[]}></tc-verification-queue>`,
    );
    expect(marks(el).map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"]);
    expect(text(el.querySelector(".ui-vq__now"))).toBe("OCR misread");
  });

  test("React: verdicts reach the element and onReview gets the verdict", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(VerificationQueue, {
          defaultClaims: MEDIA,
          verdicts: VERDICTS,
          defaultFilter: "all",
          onReview: (claim, status, _previous, verdict) => seen.push(`${claim.id}:${status}:${verdict?.id ?? "-"}`),
        }),
      ),
    );
    await settle();
    const el = host.querySelector<TcVerificationQueue>("tc-verification-queue")!;
    await act(async () => marks(el)[1].click());
    await settle();
    await act(async () => row(el, "g").click());
    await settle();
    await act(async () => marks(el)[0].click());
    await settle();
    expect(seen).toEqual(["t:incorrect:misheard", "g:verified:-"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"])
    test(`axe: verdicts and the new source types pass in both looks (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="background: ${theme === "dark" ? "#0e0e10" : "#fff"}; padding: 8px">
        <tc-verification-queue filter="all" .claims=${MEDIA} .verdicts=${VERDICTS}></tc-verification-queue>
        <tc-verification-queue look="clean" aria-label="Clean queue" filter="all" .claims=${[{ ...MEDIA[1], status: "incorrect", verdict: "misread" }, ...MEDIA.slice(2)]} .verdicts=${VERDICTS}></tc-verification-queue>
      </div>`);
      await settle();
      await Promise.all(document.getAnimations().map((x) => (x.finish(), x.finished)));
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
});
