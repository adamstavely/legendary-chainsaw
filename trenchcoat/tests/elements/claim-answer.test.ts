/*
 * <tc-claim-answer> in real browsers – claims marked by source type, the open claim, sending to verification, the
 * key, the counter-position, the claims' keyboard, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/claim-answer";
import type { AnswerClaim, ClaimOpenChange, ClaimQueuedChange, ClaimSource, ClaimVerifyDetail, TcClaimAnswer } from "../../src/elements/claim-answer";
import type { TcValidityBadge } from "../../src/elements/validity-badge";
import { ClaimAnswer } from "../../src/elements/react/claim-answer";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.parse("2026-10-24T12:00:00Z");
const DAY = 86_400_000;

const SOURCES: ClaimSource[] = [
  { id: "s1", site: "Freight quote", title: "Carrier quote", url: "https://example.com/q", quote: "Per-order cost $6.42", validity: { observed: NOW - 160 * DAY, contested: true } },
  { id: "s2", site: "Orders export", title: "Orders by region", quote: "North: 31.8% of orders" },
];
const CLAIMS: AnswerClaim[] = [
  { id: "a", text: "Costs rise 4%.", source: "grounded", confidence: 0.86, sources: ["s1"] },
  { id: "b", text: " Northern customers are a third of orders.", source: "grounded", confidence: 0.93, sources: ["s2"] },
  { id: "gap", text: " " },
  { id: "c", text: "Faster delivery lifts repeat purchases,", source: "model", confidence: 0.62, uncertainty: "evidence", note: "Studies disagree." },
  { id: "d", text: " so it pays back in two years.", source: "inferred", confidence: 0.45 },
  { id: "e", text: "Fuel prices will decide it.", source: "model", confidence: 0.3, uncertainty: "unsettled", paragraph: true },
];
const COUNTER = "The quote is old and disputed.";

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const claimEl = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-cla__claim[data-id="${id}"]`)!;
const key = async (target: Element, k: string) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await settle();
};
const make = (extra = html``) => fixture<TcClaimAnswer>(html`<tc-claim-answer .claims=${CLAIMS} .sources=${SOURCES} counter=${COUNTER} .now=${NOW}>${extra}</tc-claim-answer>`);

describe("tc-claim-answer", () => {
  test("the host is the root and a named group; claims are marked by source type, plain text isn't", async () => {
    const el = await make();
    expect(el.dataset.ui).toBe("cla");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("group");
    expect(el.getAttribute("aria-label")).toBe("Answer, claim by claim");
    const claims = [...el.querySelectorAll<HTMLElement>(".ui-cla__claim")];
    expect(claims.map((c) => c.dataset.source)).toEqual(["grounded", "grounded", "model", "inferred", "model"]);
    expect(el.querySelectorAll(".ui-cla__p")).toHaveLength(2);
    // Not only colour: each type has its own underline style
    const styles = claims.map((c) => getComputedStyle(c).textDecorationStyle);
    expect(styles).toEqual(["solid", "solid", "dashed", "dotted", "dashed"]);
    // Screen readers hear the type, the confidence and the uncertainty after the claim
    expect(text(claimEl(el, "c"))).toBe("Faster delivery lifts repeat purchases,?, Model knowledge, 62% confidence, Thin evidence");
    expect(text(el.querySelector(".ui-cla__caption"))).toBe("2 of 5 claims backed by a source");
  });

  test("a name the page gives stays", async () => {
    const el = await fixture<TcClaimAnswer>(html`<tc-claim-answer aria-label="Hub answer" .claims=${CLAIMS}></tc-claim-answer>`);
    expect(el.getAttribute("aria-label")).toBe("Hub answer");
  });

  test("the key counts each type; pressing one picks it out and says so", async () => {
    const el = await make();
    const keys = [...el.querySelectorAll<HTMLButtonElement>(".ui-cla__key")];
    expect(keys.map((k) => text(k))).toEqual(["Sourced2", "Model knowledge2", "Inferred1"]);
    keys[1].click();
    await settle();
    expect(keys[1].getAttribute("aria-pressed")).toBe("true");
    expect(el.dataset.only).toBe("model");
    expect([...el.querySelectorAll(".ui-cla__claim[data-dim]")].map((c) => (c as HTMLElement).dataset.id)).toEqual(["a", "b", "d"]);
    expect(text(el.querySelector('[role="status"]'))).toBe("Showing model knowledge claims");
    keys[1].click();
    await settle();
    expect(el.querySelectorAll(".ui-cla__claim[data-dim]")).toHaveLength(0);
  });

  test("labels are properties: source types, uncertainty kinds, confidence and buttons", async () => {
    const el = await fixture<TcClaimAnswer>(html`<tc-claim-answer
      .claims=${CLAIMS}
      .sources=${SOURCES}
      .open=${"c"}
      .sourceLabels=${{ grounded: "GRND", model: "PARAM", inferred: "SYNTH" }}
      .uncertaintyLabels=${{ evidence: "Sparse" }}
      .uncertaintyNotes=${{ evidence: "Few data points." }}
      .confidenceLabels=${{ medium: "Moderate" }}
      verify-label="Queue it"
    ></tc-claim-answer>`);
    expect(text(el.querySelector(".ui-cla__keys"))).toBe("GRND2PARAM2SYNTH1");
    expect(text(el.querySelector(".ui-cla__type"))).toBe("PARAM");
    expect(text(el.querySelector(".ui-cla__uncertain"))).toBe("? Sparse – Few data points. Studies disagree.");
    expect(text(el.querySelector(".ui-cla__conf-value"))).toBe("62% · Moderate");
    expect(text(el.querySelector(".ui-cla__btn"))).toBe("Queue it");
  });

  test("confidence bands are a property; the meter says the level", async () => {
    const el = await fixture<TcClaimAnswer>(html`<tc-claim-answer .claims=${CLAIMS} .open=${"d"} .confidenceBands=${{ high: 0.9, medium: 0.4 }}></tc-claim-answer>`);
    const meter = el.querySelector<HTMLElement>(".ui-cla__meter")!;
    expect(meter.getAttribute("role")).toBe("meter");
    expect(meter.getAttribute("aria-valuenow")).toBe("45");
    expect(meter.getAttribute("aria-valuetext")).toBe("45%, medium");
  });

  test("clicking a claim opens it in place; clicking again closes; one at a time", async () => {
    const el = await make();
    const changes: (string | null)[] = [];
    el.addEventListener("tc-open-change", (e) => changes.push((e as CustomEvent<ClaimOpenChange>).detail.open));
    claimEl(el, "a").click();
    await settle();
    expect(el.open).toBe("a");
    expect(claimEl(el, "a").getAttribute("aria-expanded")).toBe("true");
    const fold = el.querySelector<HTMLElement>(".ui-cla__fold")!;
    expect(claimEl(el, "a").getAttribute("aria-controls")).toBe(fold.id);
    expect(fold.hasAttribute("data-open")).toBe(true);
    expect(fold.getAttribute("aria-label")).toBe("Claim: Costs rise 4%.");
    expect(text(el.querySelector(".ui-cla__type"))).toBe("Sourced");
    expect(text(el.querySelector(".ui-cla__src-name"))).toBe("Freight quote");
    expect(text(el.querySelector(".ui-cla__quote"))).toBe("Per-order cost $6.42");
    claimEl(el, "c").click();
    await settle();
    expect(el.open).toBe("c");
    expect(claimEl(el, "a").getAttribute("aria-expanded")).toBe("false");
    claimEl(el, "c").click();
    await settle();
    expect(el.open).toBeNull();
    expect(fold.inert).toBe(true);
    expect(changes).toEqual(["a", "c", null]);
  });

  test("controlled: preventDefault keeps the open claim", async () => {
    const el = await make();
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    claimEl(el, "a").click();
    await settle();
    expect(el.open).toBeNull();
  });

  test("a source's freshness shows as a validity badge, counted to `now`", async () => {
    const el = await fixture<TcClaimAnswer>(html`<tc-claim-answer .claims=${CLAIMS} .sources=${SOURCES} .open=${"a"} .now=${NOW}></tc-claim-answer>`);
    const badge = el.querySelector<TcValidityBadge>("tc-validity-badge")!;
    expect(badge).toBeTruthy();
    expect(badge.now).toBe(NOW);
    expect(badge.currentBand).toBe("aging");
    expect(badge.contested).toBe(true);
    expect(text(badge.querySelector(".ui-vb__sr"))).toBe("Aging source, observed 5 months ago, contested");
    expect(el.querySelector(".ui-cla__src-name a")!.getAttribute("href")).toBe("https://example.com/q");
  });

  test("model knowledge and inferred claims say what that means; the note follows", async () => {
    const el = await fixture<TcClaimAnswer>(html`<tc-claim-answer .claims=${CLAIMS} .open=${"d"}></tc-claim-answer>`);
    expect(text(el.querySelector(".ui-cla__dt-note"))).toBe("Worked out from other claims – no source states it.");
    expect(el.querySelector(".ui-cla__sources")).toBeNull();
    el.open = "e";
    await settle();
    expect(text(el.querySelector(".ui-cla__uncertain"))).toContain("Not settled – The world hasn't decided this yet");
  });

  test("Send to verification: queued changes, tc-verify carries the claim and its sources, the button says so", async () => {
    const el = await make();
    const queued: ClaimQueuedChange[] = [];
    const sent: ClaimVerifyDetail[] = [];
    el.addEventListener("tc-queued-change", (e) => queued.push((e as CustomEvent<ClaimQueuedChange>).detail));
    el.addEventListener("tc-verify", (e) => sent.push((e as CustomEvent<ClaimVerifyDetail>).detail));
    el.open = "a";
    await settle();
    const btn = el.querySelector<HTMLButtonElement>(".ui-cla__btn")!;
    expect(text(btn)).toBe("Send to verification");
    btn.click();
    await settle();
    expect(queued).toEqual([{ queued: ["a"], claim: CLAIMS[0] }]);
    expect(sent).toHaveLength(1);
    expect(sent[0].claim.id).toBe("a");
    expect(sent[0].sources.map((s) => s.id)).toEqual(["s1"]);
    expect(el.queued).toEqual(["a"]);
    expect(text(el.querySelector(".ui-cla__btn"))).toBe("In verification queue");
    expect(el.querySelector(".ui-cla__btn")!.getAttribute("aria-disabled")).toBe("true");
    expect(text(el.querySelector('[role="status"]'))).toBe("Sent to verification: Costs rise 4%.");
    expect(text(el.querySelector(".ui-cla__caption"))).toBe("2 of 5 claims backed by a source · 1 sent to verification");
    // Pressing it again does nothing
    el.querySelector<HTMLButtonElement>(".ui-cla__btn")!.click();
    await settle();
    expect(sent).toHaveLength(1);
  });

  test("controlled queued: preventDefault keeps `queued`, but the claim is still sent", async () => {
    const el = await make();
    const sent: string[] = [];
    el.addEventListener("tc-queued-change", (e) => e.preventDefault());
    el.addEventListener("tc-verify", (e) => sent.push((e as CustomEvent<ClaimVerifyDetail>).detail.claim.id));
    el.open = "b";
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-cla__btn")!.click();
    await settle();
    expect(el.queued).toEqual([]);
    expect(sent).toEqual(["b"]);
  });

  test("the counter-position folds open and closed", async () => {
    const el = await make();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-cla__counter-toggle")!;
    const fold = el.querySelector<HTMLElement>(`#${toggle.getAttribute("aria-controls")}`)!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(fold.inert).toBe(true);
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(fold.inert).toBe(false);
    expect(text(fold)).toBe(COUNTER);
    el.counter = "";
    await settle();
    expect(el.querySelector(".ui-cla__counter")).toBeNull();
  });

  test("keyboard: the claims are one tab stop; arrows, Home and End move; Enter opens; Escape closes and returns focus", async () => {
    const el = await make();
    const tabbable = () => [...el.querySelectorAll<HTMLElement>(".ui-cla__claim")].filter((c) => c.tabIndex === 0).map((c) => c.dataset.id);
    expect(tabbable()).toEqual(["a"]);
    claimEl(el, "a").focus();
    await key(claimEl(el, "a"), "ArrowRight");
    expect(document.activeElement).toBe(claimEl(el, "b"));
    expect(tabbable()).toEqual(["b"]);
    await key(claimEl(el, "b"), "End");
    expect(document.activeElement).toBe(claimEl(el, "e"));
    await key(claimEl(el, "e"), "ArrowDown");
    expect(document.activeElement).toBe(claimEl(el, "e"));
    await key(claimEl(el, "e"), "Home");
    expect(document.activeElement).toBe(claimEl(el, "a"));
    await key(claimEl(el, "a"), "ArrowLeft");
    expect(document.activeElement).toBe(claimEl(el, "a"));
    await key(claimEl(el, "a"), "ArrowRight");
    await key(claimEl(el, "b"), "Enter");
    expect(el.open).toBe("b");
    // Into the detail, then Escape: it closes and focus goes back to the claim
    el.querySelector<HTMLButtonElement>(".ui-cla__btn")!.focus();
    await key(el.querySelector(".ui-cla__btn")!, "Escape");
    expect(el.open).toBeNull();
    expect(document.activeElement).toBe(claimEl(el, "b"));
    await key(claimEl(el, "b"), " ");
    expect(el.open).toBe("b");
  });

  test("the close button closes and hands focus back to the claim", async () => {
    const el = await make();
    claimEl(el, "c").click();
    await settle();
    const close = el.querySelector<HTMLButtonElement>(".ui-cla__close")!;
    close.focus();
    close.click();
    await settle();
    expect(el.open).toBeNull();
    expect(document.activeElement).toBe(claimEl(el, "c"));
  });

  test("hovering a claim says what it is on the line under the answer", async () => {
    const el = await make();
    claimEl(el, "e").dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    await settle();
    expect(text(el.querySelector(".ui-cla__caption"))).toBe("Model knowledge · 30% confidence · Not settled");
    expect(claimEl(el, "e").hasAttribute("data-hl")).toBe(true);
  });

  test("clean: one card, the line under the answer as its last row", async () => {
    const el = await fixture<TcClaimAnswer>(html`<tc-claim-answer look="clean" .claims=${CLAIMS}></tc-claim-answer>`);
    expect(el.querySelector(".ui-cla__body")).toBeTruthy();
    expect(el.querySelector(".ui-cla__card")).toBeNull();
    expect(getComputedStyle(el.querySelector(".ui-cla__foot")!).borderTopStyle).toBe("solid");
  });

  test("React: open and queued controlled; onVerify gets the claim and its sources", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const verified: string[] = [];
    let setTick: (n: number) => void = () => {};
    function App() {
      const [open, setOpen] = React.useState<string | null>("a");
      const [queued, setQueued] = React.useState<string[]>([]);
      const [tick, set] = React.useState(0);
      setTick = set;
      return React.createElement(ClaimAnswer, {
        "data-tick": tick,
        claims: CLAIMS,
        sources: SOURCES,
        open,
        onOpenChange: setOpen,
        queued,
        onQueuedChange: setQueued,
        onVerify: (claim, sources) => verified.push(`${claim.id}:${sources.map((s) => s.id).join(",")}`),
      } as React.ComponentProps<typeof ClaimAnswer>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcClaimAnswer>("tc-claim-answer")!;
    expect(el.open).toBe("a");
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-cla__btn")!.click());
    await settle();
    expect(verified).toEqual(["a:s1"]);
    expect(el.queued).toEqual(["a"]);
    await act(async () => claimEl(el, "c").click());
    await settle();
    expect(el.open).toBe("c");
    // A parent re-render keeps both values
    await act(async () => setTick(1));
    await settle();
    expect(el.open).toBe("c");
    expect(el.queued).toEqual(["a"]);
    await act(async () => root.unmount());
  });

  test("React uncontrolled: the element keeps its own open claim across parent renders", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let setTick: (n: number) => void = () => {};
    function App() {
      const [tick, set] = React.useState(0);
      setTick = set;
      return React.createElement(ClaimAnswer, { "data-tick": tick, claims: CLAIMS, sources: SOURCES } as React.ComponentProps<typeof ClaimAnswer>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcClaimAnswer>("tc-claim-answer")!;
    await act(async () => claimEl(el, "b").click());
    await act(async () => setTick(1));
    await settle();
    expect(el.open).toBe("b");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"])
    test(`axe: no violations in either look (${theme}), with a claim and the counter-position open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="background: ${theme === "dark" ? "#0e0e10" : "#fff"}; padding: 8px">
        <tc-claim-answer .claims=${CLAIMS} .sources=${SOURCES} counter=${COUNTER} .now=${NOW} .open=${"a"}></tc-claim-answer>
        <tc-claim-answer look="clean" aria-label="Clean answer" .claims=${CLAIMS} .sources=${SOURCES} counter=${COUNTER} .now=${NOW} .open=${"c"} .queued=${["c"]}></tc-claim-answer>
      </div>`);
      for (const t of wrap.querySelectorAll<HTMLButtonElement>(".ui-cla__counter-toggle")) t.click();
      wrap.querySelector<HTMLButtonElement>(".ui-cla__key")!.click();
      await settle();
      await Promise.all(document.getAnimations().map((x) => (x.finish(), x.finished)));
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
});

describe("tc-claim-answer – media and memory, ceilings, the question type", () => {
  const MEDIA_SOURCES: ClaimSource[] = [
    { id: "call", site: "Site call", title: "Call transcript", quote: "End of January for the bays." },
    { id: "lease", site: "Lease scan", title: "Scanned lease", quote: "Occupation from 1 February.", validity: { observed: NOW - 24 * DAY, changed: true } },
  ];
  const MEDIA: AnswerClaim[] = [
    { id: "t", text: "The bays are done by January,", source: "transcript", confidence: 0.88, recognition: 0.91, sources: ["call"] },
    { id: "o", text: " and we move in on 1 February.", source: "ocr", confidence: 0.9, recognition: 0.72, sources: ["lease"] },
    { id: "i", text: " The racking is still crated.", source: "image", confidence: 0.64 },
    { id: "s", text: "Fit-out ran late last time,", source: "session", confidence: 0.7, paragraph: true },
    { id: "k", text: " so add a month,", source: "team", confidence: 0.75 },
    { id: "g", text: " and expect mid-March.", source: "agent", confidence: 0.58 },
  ];
  const CEILINGS = { transcript: 0.8, image: 0.7, ocr: 0.85, session: 0.7 };
  const media = (extra = html``) =>
    fixture<TcClaimAnswer>(html`<tc-claim-answer .claims=${MEDIA} .sources=${MEDIA_SOURCES} .now=${NOW} .confidenceCeilings=${CEILINGS}>${extra}</tc-claim-answer>`);

  test("media types share a double line, memory types a wavy one; the key names each; media count as sourced", async () => {
    const el = await media();
    const claims = [...el.querySelectorAll<HTMLElement>(".ui-cla__claim")];
    expect(claims.map((c) => getComputedStyle(c).textDecorationStyle)).toEqual(["double", "double", "double", "wavy", "wavy", "wavy"]);
    expect([...el.querySelectorAll(".ui-cla__key")].map((k) => text(k))).toEqual([
      "Transcript1",
      "Image1",
      "OCR1",
      "Earlier session1",
      "Team knowledge1",
      "Agent finding1",
    ]);
    // The key's swatch draws the same line
    expect([...el.querySelectorAll(".ui-cla__key .ui-cla__swatch path")].map((p) => p.getAttribute("data-line"))).toEqual(["double", "double", "double", "wavy", "wavy", "wavy"]);
    expect(text(el.querySelector(".ui-cla__caption"))).toBe("3 of 6 claims backed by a source");
  });

  test("a media claim says how well the medium was read, beside its type", async () => {
    const el = await media();
    expect(text(claimEl(el, "o"))).toBe("and we move in on 1 February., OCR 72%, 72% confidence (capped)");
    claimEl(el, "o").click();
    await settle();
    expect(text(el.querySelector(".ui-cla__detail .ui-cla__type"))).toBe("OCR72%");
    expect(text(el.querySelector(".ui-cla__dt-note"))).toBe("From text read off a scan – the reading can be wrong, so check the original.");
  });

  test("confidence ceilings: a type's ceiling and the recognition cap what's shown, and the detail says why", async () => {
    const el = await media();
    // Transcript: the model said 88%, transcripts go no higher than 80%
    claimEl(el, "t").click();
    await settle();
    const meter = () => el.querySelector<HTMLElement>(".ui-cla__detail .ui-cla__meter")!;
    expect(meter().getAttribute("aria-valuenow")).toBe("80");
    expect(meter().getAttribute("aria-valuetext")).toBe("80%, high, capped");
    expect(text(el.querySelector(".ui-cla__cap"))).toBe("Capped at 80% – the model said 88%, but transcript claims are shown no higher.");
    // OCR: the ceiling is 85%, but the scan was only read at 72%
    claimEl(el, "o").click();
    await settle();
    expect(meter().getAttribute("aria-valuenow")).toBe("72");
    expect(text(el.querySelector(".ui-cla__cap"))).toBe("Capped at 72% – the model said 90%, but the source itself was only read at 72%.");
    // Under its ceiling, or a type with none: shown as given, with no note
    claimEl(el, "g").click();
    await settle();
    expect(meter().getAttribute("aria-valuenow")).toBe("58");
    expect(el.querySelector(".ui-cla__cap")).toBeNull();
    // The line under the answer uses the shown value
    claimEl(el, "t").dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    await settle();
    expect(text(el.querySelector(".ui-cla__caption"))).toBe("Transcript · 80% confidence");
  });

  test("ceilings apply to the text types too; without any, nothing is capped", async () => {
    const el = await make();
    expect(text(claimEl(el, "a"))).toBe("Costs rise 4%., Sourced, 86% confidence");
    el.confidenceCeilings = { grounded: 0.75 };
    await settle();
    expect(text(claimEl(el, "a"))).toBe("Costs rise 4%., Sourced, 75% confidence (capped)");
    expect(el.shownConfidence(CLAIMS[0])).toEqual({ value: 0.75, capped: "type" });
    expect(el.shownConfidence(CLAIMS[2])).toBeNull();
  });

  test("memory types say what they are; labels and notes are properties", async () => {
    const el = await media();
    claimEl(el, "s").click();
    await settle();
    expect(text(el.querySelector(".ui-cla__dt-note"))).toBe("Remembered from an earlier session, not retrieved now – it may be out of date.");
    el.sourceLabels = { session: "Last week's chat" };
    el.sourceNotes = { session: "From last week." };
    await settle();
    expect(text(el.querySelector(".ui-cla__detail .ui-cla__type"))).toBe("Last week's chat");
    expect(text(el.querySelector(".ui-cla__dt-note"))).toBe("From last week.");
  });

  test("a source that changed since it was used shows it on its badge", async () => {
    const el = await media();
    claimEl(el, "o").click();
    await settle();
    const badge = el.querySelector<TcValidityBadge>(".ui-cla__detail tc-validity-badge")!;
    expect(badge.changed).toBe(true);
    expect(badge.querySelector('.ui-vb__flag[data-kind="changed"]')).not.toBeNull();
  });

  test("the question type: a tag in the head with its meaning; none by default; labels and notes are properties", async () => {
    const el = await make();
    expect(el.querySelector(".ui-cla__qtype")).toBeNull();
    el.questionType = "predictive";
    await settle();
    const tag = el.querySelector<HTMLElement>(".ui-cla__qtype")!;
    expect(tag.dataset.qtype).toBe("predictive");
    expect(text(tag)).toBe("Question type: Predictive. Asks about the future – expect more uncertainty than a fact carries.");
    expect(tag.title).toBe("Asks about the future – expect more uncertainty than a fact carries.");
    el.questionTypeLabels = { predictive: "Forecast" };
    el.questionTypeNotes = { predictive: "About what happens next." };
    await settle();
    expect(text(el.querySelector(".ui-cla__qtype"))).toBe("Question type: Forecast. About what happens next.");
    // Set as an attribute too; an unknown value shows no tag
    el.setAttribute("question-type", "factual");
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-cla__qtype")!.dataset.qtype).toBe("factual");
    el.setAttribute("question-type", "rumour");
    await settle();
    expect(el.querySelector(".ui-cla__qtype")).toBeNull();
  });

  test("React: ceilings and the question type reach the element", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () =>
      root.render(React.createElement(ClaimAnswer, { claims: MEDIA, sources: MEDIA_SOURCES, confidenceCeilings: CEILINGS, questionType: "analytical", now: NOW })),
    );
    await settle();
    const el = host.querySelector<TcClaimAnswer>("tc-claim-answer")!;
    expect(el.questionType).toBe("analytical");
    expect(text(claimEl(el, "t"))).toContain("80% confidence (capped)");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"])
    test(`axe: media and memory claims, a capped claim open and the question tag pass (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="background: ${theme === "dark" ? "#0e0e10" : "#fff"}; padding: 8px">
        <tc-claim-answer question-type="predictive" .claims=${MEDIA} .sources=${MEDIA_SOURCES} .confidenceCeilings=${CEILINGS} .now=${NOW} .open=${"o"}></tc-claim-answer>
        <tc-claim-answer look="clean" aria-label="Clean answer" question-type="opinion" .claims=${MEDIA} .sources=${MEDIA_SOURCES} .confidenceCeilings=${CEILINGS} .now=${NOW} .open=${"s"}></tc-claim-answer>
      </div>`);
      await settle();
      await Promise.all(document.getAnimations().map((x) => (x.finish(), x.finished)));
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
});
