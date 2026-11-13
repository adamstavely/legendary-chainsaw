/*
 * <tc-handoff-brief> in real browsers: the host and both looks, the three sections, acknowledging each one (toggle,
 * progress, cancelable tc-acknowledged-change), the access block and Request access (no resolver, resolver success,
 * failure and retry, prevented), Accept only when ready (cancelable tc-accept), focus after accepting, empty sections,
 * the React wrapper and axe. An in-flight run: the sender's view, choosing a receiver and the pause, Hand off and Cancel
 * handoff (both cancelable), the wrapper, and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/handoff-brief";
import type { HandoffBriefAccess, HandoffBriefItem, HandoffBriefPerson, HandoffBriefRun, TcHandoffBrief } from "../../src/elements/handoff-brief";
import { HandoffBrief } from "../../src/elements/react/handoff-brief";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const OPEN: HandoffBriefItem[] = [
  { id: "u1", text: "Confirm capacity", detail: "Promised Thursday", meta: "Due Thu" },
  { id: "u2", text: "Check clause 9" },
];
const PROMISED: HandoffBriefItem[] = [{ id: "c1", text: "Send the summary", meta: "Fri" }];
const MISSING: HandoffBriefAccess[] = [{ id: "m1", label: "Supplier contract", where: "Unresolved item 2" }];
const make = (look = "standard", missing: HandoffBriefAccess[] = []) =>
  fixture<TcHandoffBrief>(
    html`<tc-handoff-brief look=${look} .from=${{ name: "Ana" }} .to=${{ name: "Sam" }} at="Today" summary="Two-thirds done." .unresolved=${OPEN} .commitments=${PROMISED} .missing=${missing}></tc-handoff-brief>`,
  );
const acks = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-hob__ack")];
const acceptBtn = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-hob__btn--primary");
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;

describe("tc-handoff-brief", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a group named by its heading; from, to and when; progress first; three sections`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("hob");
      expect(el.dataset.look).toBe(look);
      expect(el.dataset.state).toBe("open");
      expect(el.getAttribute("role")).toBe("group");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Handoff");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("From Ana to Sam · Today");
      expect(plain(el.querySelector(".tc-head__aside")!.textContent)).toBe("0/3 acknowledged");
      expect(el.querySelector(".ui-hob__body")!.firstElementChild!.classList.contains("ui-hob__state")).toBe(true);
      const bar = el.querySelector('[role="progressbar"]')!;
      expect([bar.getAttribute("aria-valuenow"), bar.getAttribute("aria-valuemax"), bar.getAttribute("aria-valuetext")]).toEqual(["0", "3", "0 of 3"]);
      const groups = el.querySelectorAll<HTMLElement>('.ui-hob__section[role="group"]');
      expect([...groups].map((g) => plain(document.getElementById(g.getAttribute("aria-labelledby")!)!.textContent))).toEqual([
        "1Summary",
        "2Unresolved items2",
        "3Commitments made1",
      ]);
      expect(plain(groups[1].querySelector(".ui-hob__item")!.textContent)).toBe("Confirm capacityPromised Thursday Due Thu");
      expect(!!el.querySelector(".ui-hob__card .ui-hob__foot")).toBe(look === "clean");
    });
  }

  test("each section is acknowledged separately; Accept waits for all three", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-acknowledged-change", (e) => seen.push((e as CustomEvent).detail));
    expect(acceptBtn(el)!.disabled).toBe(true);
    expect(el.querySelector(".ui-hob__hint")!.textContent).toBe("Acknowledge 3 more sections to accept.");
    expect(plain(acks(el)[0].textContent)).toBe("Acknowledge Summary");
    acks(el)[1].click();
    await settle();
    expect(seen).toEqual([{ acknowledged: ["unresolved"], section: "unresolved", on: true }]);
    expect(acks(el)[1].getAttribute("aria-pressed")).toBe("true");
    expect(plain(acks(el)[1].textContent)).toBe("Acknowledged Unresolved items");
    expect(status(el)).toBe("Unresolved items acknowledged. 1 of 3.");
    acks(el)[0].click();
    acks(el)[2].click();
    await settle();
    expect(el.acknowledged).toEqual(["summary", "unresolved", "commitments"]);
    expect(el.dataset.state).toBe("ready");
    expect(acceptBtn(el)!.disabled).toBe(false);
    acks(el)[0].click();
    await settle();
    expect(el.acknowledged).toEqual(["unresolved", "commitments"]);
    expect(acceptBtn(el)!.disabled).toBe(true);
  });

  test("prevented, an acknowledgement doesn't stick", async () => {
    const el = await make();
    el.addEventListener("tc-acknowledged-change", (e) => e.preventDefault());
    acks(el)[0].click();
    await settle();
    expect(el.acknowledged).toEqual([]);
    expect(acks(el)[0].getAttribute("aria-pressed")).toBe("false");
  });

  test("Accept: tc-accept, then the accepted state; focus moves to it; prevented, nothing changes", async () => {
    const el = await make();
    el.acknowledged = ["summary", "unresolved", "commitments"];
    await settle();
    let prevent = true;
    const seen: unknown[] = [];
    el.addEventListener("tc-accept", (e) => {
      seen.push((e as CustomEvent).detail);
      if (prevent) e.preventDefault();
    });
    acceptBtn(el)!.click();
    await settle();
    expect(el.accepted).toBe(false);
    prevent = false;
    acceptBtn(el)!.focus();
    acceptBtn(el)!.click();
    await settle();
    await wait(50);
    expect(seen.length).toBe(2);
    expect(seen[1]).toEqual({ acknowledged: ["summary", "unresolved", "commitments"] });
    expect(el.accepted).toBe(true);
    expect(el.dataset.state).toBe("accepted");
    expect(acceptBtn(el)).toBeNull();
    expect(acks(el).length).toBe(0);
    expect(document.activeElement).toBe(el.querySelector(".ui-hob__state"));
    expect(status(el)).toBe("Handoff accepted. The work is yours now.");
  });

  test("missing access blocks the handoff, lists what's missing, and Request access marks it requested", async () => {
    const el = await make("standard", MISSING);
    expect(el.dataset.state).toBe("blocked");
    expect(plain(el.querySelector(".tc-head__aside")!.textContent)).toBe("Blocked");
    expect(plain(el.querySelector(".ui-hob__state-text")!.textContent)).toMatch(/^Blocked\. You can't open 1 item this work refers to\./);
    expect(el.querySelector(".ui-hob__missing")!.getAttribute("aria-label")).toBe("What you can't open");
    expect(plain(el.querySelector(".ui-hob__miss")!.textContent)).toBe("Supplier contractUnresolved item 2");
    el.acknowledged = ["summary", "unresolved", "commitments"];
    await settle();
    expect(acceptBtn(el)!.disabled).toBe(true);
    expect(el.querySelector(".ui-hob__hint")!.textContent).toBe("Blocked until you can open everything it refers to.");
    const seen: unknown[] = [];
    el.addEventListener("tc-access-request", (e) => seen.push((e as CustomEvent).detail.items));
    el.querySelector<HTMLButtonElement>(".ui-hob__access button")!.click();
    await settle();
    expect(seen).toEqual([MISSING]);
    expect(el.accessRequest).toBe("requested");
    expect(el.querySelector<HTMLElement>(".ui-hob__note")!.dataset.request).toBe("requested");
    // The app grants access: the block lifts and Accept is enabled
    el.missing = [];
    await settle();
    expect(el.dataset.state).toBe("ready");
    expect(acceptBtn(el)!.disabled).toBe(false);
    expect(status(el)).toBe("Access granted. Nothing blocks the handoff.");
  });

  test("with a resolver: Requesting…, a failure with Retry, then requested; prevented, the app owns it", async () => {
    const el = await make("standard", MISSING);
    let fail = true;
    let release!: () => void;
    el.requestAccess = () => new Promise((res, rej) => (release = () => (fail ? rej(new Error("x")) : res(undefined))));
    el.querySelector<HTMLButtonElement>(".ui-hob__access button")!.click();
    await settle();
    expect(el.accessRequest).toBe("pending");
    release();
    await wait(10);
    await settle();
    expect(el.accessRequest).toBe("failed");
    expect(status(el)).toBe("Couldn't request access.");
    fail = false;
    el.querySelector<HTMLButtonElement>(".ui-hob__access button")!.click();
    await settle();
    release();
    await wait(10);
    await settle();
    expect(el.accessRequest).toBe("requested");
    const other = await make("standard", MISSING);
    other.addEventListener("tc-access-request", (e) => e.preventDefault());
    other.querySelector<HTMLButtonElement>(".ui-hob__access button")!.click();
    await settle();
    expect(other.accessRequest).toBe("");
  });

  test("empty sections are left out and not required; titles and labels are properties", async () => {
    const el = await fixture<TcHandoffBrief>(html`<tc-handoff-brief summary="Done." accept-label="Take it on"></tc-handoff-brief>`);
    expect(el.querySelectorAll(".ui-hob__section").length).toBe(1);
    expect(el.querySelector(".tc-head__sub")).toBeNull();
    el.sectionTitles = { summary: "Where it stands" };
    await settle();
    expect(plain(acks(el)[0].textContent)).toBe("Acknowledge Where it stands");
    acks(el)[0].click();
    await settle();
    expect(plain(acceptBtn(el)!.textContent)).toBe("Take it on");
    expect(acceptBtn(el)!.disabled).toBe(false);
    el.summary = "";
    await settle();
    expect(el.querySelector(".ui-hob__empty")!.textContent).toBe("Nothing in this handoff yet.");
    expect(acceptBtn(el)!.disabled).toBe(true);
  });

  test("the wrapper: acknowledged survives a re-render; onAccept fires; onRequestAccess gets the items", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: unknown[] = [];
    const render = (n: number, missing: HandoffBriefAccess[] = []) =>
      root.render(
        React.createElement(HandoffBrief, {
          title: `Brief ${n}`,
          summary: "S",
          unresolved: OPEN,
          missing,
          onAccept: () => calls.push("accept"),
          onRequestAccess: (items) => calls.push(items.length),
        }),
      );
    await act(async () => render(0, MISSING));
    await settle();
    const el = host.querySelector("tc-handoff-brief")!;
    el.querySelector<HTMLButtonElement>(".ui-hob__access button")!.click();
    await act(async () => render(1));
    await settle();
    acks(el)[0].click();
    await settle();
    await act(async () => render(2));
    await settle();
    expect(el.acknowledged).toEqual(["summary"]);
    acks(el)[1].click();
    await settle();
    acceptBtn(el)!.click();
    await settle();
    expect(calls).toEqual([1, "accept"]);
    expect(el.accepted).toBe(true);
    expect(el.querySelector("h3")!.textContent).toBe("Brief 2");
    await act(async () => root.unmount());
  });

  describe("an in-flight run", () => {
    const RUN: HandoffBriefRun = { id: "r1", title: "Reconcile the Q3 ledger", status: "running", step: "Matching invoices", startedAt: Date.UTC(2026, 9, 23, 14, 2), owner: "Ana" };
    const PEOPLE: HandoffBriefPerson[] = [
      { id: "sam", name: "Sam Patel", role: "Analyst" },
      { id: "priya", name: "Priya Shah" },
    ];
    const makeRun = (look = "standard") =>
      fixture<TcHandoffBrief>(
        html`<tc-handoff-brief look=${look} locale="en-GB" .from=${{ name: "Ana" }} summary="Two-thirds done." .unresolved=${OPEN} .run=${RUN} .people=${PEOPLE}></tc-handoff-brief>`,
      );
    const select = (el: Element) => el.querySelector<HTMLSelectElement>(".ui-hob__select")!;
    const choose = async (el: Element, value: string) => {
      select(el).value = value;
      select(el).dispatchEvent(new Event("change", { bubbles: true }));
      await settle();
    };
    const handOff = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-hob__handoff")!;

    for (const look of ["standard", "clean"] as const) {
      test(`${look}: the sender's view – the run first, what goes with it, the sections without Acknowledge`, async () => {
        const el = await makeRun(look);
        expect(el.dataset.state).toBe("sending");
        const run = el.querySelector(".ui-hob__run")!;
        expect(el.querySelector(".ui-hob__body")!.firstElementChild).toBe(run);
        expect(document.getElementById(run.getAttribute("aria-labelledby")!)!.textContent).toBe("In-flight run");
        expect(plain(el.querySelector(".ui-hob__run-title")!.textContent)).toBe("Running Reconcile the Q3 ledger");
        expect(plain(el.querySelector(".ui-hob__run-step")!.textContent)).toBe("Now: Matching invoices");
        expect(el.querySelector(".ui-hob__run-meta")!.textContent).toMatch(/^Started by Ana at \d{1,2}:02/);
        expect([...el.querySelectorAll(".ui-hob__takes .ui-hob__item")].map((li) => plain(li.textContent))).toEqual([
          "Its pending approvals",
          "Its notifications",
          "Stopping or pausing it",
        ]);
        expect(plain(el.querySelector(".tc-head__aside")!.textContent)).toBe("Running");
        expect(acks(el)).toHaveLength(0);
        expect(el.querySelectorAll(".ui-hob__section")).toHaveLength(2);
        expect(el.querySelector('[role="progressbar"]')).toBe(null);
        expect([...select(el).options].map((o) => o.textContent)).toEqual(["Choose a person", "Sam Patel – Analyst", "Priya Shah"]);
        expect(handOff(el).disabled).toBe(true);
        expect(el.querySelector(".ui-hob__hint")!.textContent).toBe("Choose who takes the run over.");
        expect(!!el.querySelector(".ui-hob__card .ui-hob__foot")).toBe(look === "clean");
      });
    }

    test("choosing a receiver and the pause; Hand off sends it and the card waits; Cancel handoff takes it back", async () => {
      const el = await makeRun();
      const seen: [string, unknown][] = [];
      for (const n of ["tc-handoff-to-change", "tc-pause-until-accepted-change", "tc-handoff", "tc-handoff-cancel"])
        el.addEventListener(n, (e) => seen.push([n, (e as CustomEvent).detail]));
      await choose(el, "priya");
      expect(el.handoffTo).toBe("priya");
      expect(seen[0]).toEqual(["tc-handoff-to-change", { handoffTo: "priya", person: PEOPLE[1] }]);
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("From Ana to Priya Shah");
      expect(el.querySelector(".ui-hob__takes-label")!.textContent).toBe("Priya Shah takes over");
      expect(el.querySelector(".ui-hob__hint")!.textContent).toBe("Priya Shah will be asked to accept. The run pauses until then.");
      expect(handOff(el).disabled).toBe(false);
      const radios = el.querySelectorAll<HTMLInputElement>(".ui-hob__radio input");
      expect([radios[0].checked, radios[1].checked]).toEqual([true, false]);
      radios[1].click();
      await settle();
      expect(el.pauseUntilAccepted).toBe(false);
      expect(seen[1]).toEqual(["tc-pause-until-accepted-change", { pauseUntilAccepted: false }]);
      expect(el.querySelector(".ui-hob__hint")!.textContent).toBe("Priya Shah will be asked to accept.");
      const note = el.querySelector<HTMLTextAreaElement>(".ui-hob__textarea")!;
      note.value = "  The duplicates are vendors 14 and 21.  ";
      note.dispatchEvent(new Event("input", { bubbles: true }));
      handOff(el).focus();
      handOff(el).click();
      await settle();
      expect(seen[2]).toEqual(["tc-handoff", { to: PEOPLE[1], run: RUN, pauseUntilAccepted: false, note: "The duplicates are vendors 14 and 21." }]);
      expect(el.handoffState).toBe("sent");
      expect(el.getAttribute("handoff-state")).toBe("sent");
      expect(el.dataset.state).toBe("sent");
      expect(plain(el.querySelector('.ui-hob__state[data-state="waiting"]')!.textContent)).toBe("Waiting for Priya Shah to accept. The run keeps going meanwhile. Cancel handoff");
      expect(el.querySelector(".ui-hob__form")).toBe(null);
      expect(el.querySelector(".ui-hob__foot")).toBe(null);
      expect(plain(el.querySelector(".tc-head__aside")!.textContent)).toBe("Handoff sent");
      await expect.poll(() => document.activeElement?.classList.contains("ui-hob__state")).toBe(true);
      expect(status(el)).toBe("Handed off to Priya Shah. Waiting for Priya Shah to accept.");
      el.querySelector<HTMLButtonElement>(".ui-hob__cancel")!.click();
      await settle();
      expect(seen[3]).toEqual(["tc-handoff-cancel", { to: PEOPLE[1], run: RUN }]);
      expect(el.handoffState).toBe("");
      expect(status(el)).toBe("Handoff cancelled. The run is still yours.");
      expect(select(el).value).toBe("priya");
    });

    test("prevented: the receiver, the pause, Hand off and Cancel stay as they were", async () => {
      const el = await makeRun();
      el.addEventListener("tc-handoff-to-change", (e) => e.preventDefault());
      await choose(el, "sam");
      expect(el.handoffTo).toBe("");
      expect(select(el).value).toBe("");
      el.handoffTo = "sam";
      await settle();
      expect(select(el).value).toBe("sam");
      el.addEventListener("tc-pause-until-accepted-change", (e) => e.preventDefault());
      const radios = el.querySelectorAll<HTMLInputElement>(".ui-hob__radio input");
      radios[1].click();
      await settle();
      expect(el.pauseUntilAccepted).toBe(true);
      expect([radios[0].checked, radios[1].checked]).toEqual([true, false]);
      const stop = (e: Event) => e.preventDefault();
      el.addEventListener("tc-handoff", stop);
      handOff(el).click();
      await settle();
      expect(el.handoffState).toBe("");
      el.removeEventListener("tc-handoff", stop);
      handOff(el).click();
      await settle();
      expect(el.handoffState).toBe("sent");
      expect(plain(el.querySelector(".ui-hob__state-text")!.textContent)).toBe("Waiting for Sam Patel to accept. The run is paused until they do.");
      el.addEventListener("tc-handoff-cancel", (e) => e.preventDefault());
      el.querySelector<HTMLButtonElement>(".ui-hob__cancel")!.click();
      await settle();
      expect(el.handoffState).toBe("sent");
    });

    test("the run's status and step follow the page; paused and waiting say so; renamed takes-over; without a run nothing changes", async () => {
      const el = await makeRun();
      el.run = { ...RUN, status: "waiting", step: "Asking about vendor 14" };
      el.takesOver = ["Its open question"];
      await settle();
      expect(plain(el.querySelector(".ui-hob__run-status")!.textContent)).toBe("Waiting for input");
      expect(el.querySelector(".ui-hob__run-status")!.getAttribute("data-status")).toBe("waiting");
      expect(plain(el.querySelector(".ui-hob__run-step")!.textContent)).toBe("Now: Asking about vendor 14");
      expect(plain(el.querySelector(".tc-head__aside")!.textContent)).toBe("Waiting for input");
      expect([...el.querySelectorAll(".ui-hob__takes li")].map((li) => li.textContent)).toEqual(["Its open question"]);
      el.run = { ...RUN, status: "paused" };
      await settle();
      expect(plain(el.querySelector(".ui-hob__run-status")!.textContent)).toBe("Paused");
      el.run = undefined;
      await settle();
      expect(el.dataset.state).toBe("open");
      expect(el.querySelector(".ui-hob__run")).toBe(null);
      expect(acks(el)).toHaveLength(2);
      expect(acceptBtn(el)!.textContent!.trim()).toBe("Accept handoff");
    });

    test("the wrapper: the receiver survives a re-render; onHandoff and onHandoffCancel; controlled handoffState", async () => {
      const host = document.createElement("div");
      document.body.append(host);
      const root = createRoot(host);
      const calls: unknown[] = [];
      const render = (n: number, extra: Record<string, unknown> = {}) =>
        root.render(
          React.createElement(HandoffBrief, {
            title: `Run ${n}`,
            summary: "S",
            run: RUN,
            people: PEOPLE,
            onHandoffToChange: (to, person) => calls.push(["to", to, person?.name]),
            onHandoff: (h) => void calls.push(["handoff", h.to.id, h.pauseUntilAccepted]),
            onHandoffCancel: () => void calls.push(["cancel"]),
            ...extra,
          }),
        );
      await act(async () => render(0));
      await settle();
      const el = host.querySelector("tc-handoff-brief")!;
      await choose(el, "sam");
      await act(async () => render(1));
      await settle();
      expect(el.handoffTo).toBe("sam");
      expect(select(el).value).toBe("sam");
      handOff(el).click();
      await settle();
      await act(async () => render(2));
      await settle();
      expect(el.handoffState).toBe("sent");
      el.querySelector<HTMLButtonElement>(".ui-hob__cancel")!.click();
      await settle();
      expect(el.handoffState).toBe("");
      expect(calls).toEqual([["to", "sam", "Sam Patel"], ["handoff", "sam", true], ["cancel"]]);
      // Controlled: Hand off reports, and the card waits only once the parent says so
      await act(async () => render(3, { handoffState: "" }));
      await settle();
      handOff(el).click();
      await settle();
      expect(el.handoffState).toBe("");
      await act(async () => render(4, { handoffState: "sent" }));
      await settle();
      expect(el.handoffState).toBe("sent");
      expect(el.querySelector(".ui-hob__cancel")).not.toBe(null);
      await act(async () => root.unmount());
    });
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10" : ""}>
        <tc-handoff-brief .from=${{ name: "Ana" }} summary="S" .unresolved=${OPEN} .commitments=${PROMISED} .acknowledged=${["summary"]}></tc-handoff-brief>
        <tc-handoff-brief look="clean" heading="Blocked" summary="S" .missing=${MISSING} access-request="failed"></tc-handoff-brief>
        <tc-handoff-brief look="clean" heading="Accepted" summary="S" accepted .acknowledged=${["summary"]}></tc-handoff-brief>
        <tc-handoff-brief heading="Run" summary="S" .run=${{ id: "r", title: "Reconcile", status: "running", step: "Matching", owner: "Ana" }} .people=${[{ id: "p", name: "Priya" }]} handoff-to="p"></tc-handoff-brief>
        <tc-handoff-brief look="clean" heading="Run waiting" summary="S" .run=${{ id: "r", title: "Reconcile", status: "waiting" }} .people=${[{ id: "p", name: "Priya" }]} handoff-to="p" handoff-state="sent"></tc-handoff-brief>
      </div>`);
      await wait(400);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
