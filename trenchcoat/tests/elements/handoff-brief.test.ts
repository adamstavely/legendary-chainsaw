/*
 * <tc-handoff-brief> in real browsers: the host and both looks, the three sections, acknowledging each one (toggle,
 * progress, cancelable tc-acknowledged-change), the access block and Request access (no resolver, resolver success,
 * failure and retry, prevented), Accept only when ready (cancelable tc-accept), focus after accepting, empty sections,
 * the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/handoff-brief";
import type { HandoffBriefAccess, HandoffBriefItem, TcHandoffBrief } from "../../src/elements/handoff-brief";
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

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10" : ""}>
        <tc-handoff-brief .from=${{ name: "Ana" }} summary="S" .unresolved=${OPEN} .commitments=${PROMISED} .acknowledged=${["summary"]}></tc-handoff-brief>
        <tc-handoff-brief look="clean" heading="Blocked" summary="S" .missing=${MISSING} access-request="failed"></tc-handoff-brief>
        <tc-handoff-brief look="clean" heading="Accepted" summary="S" accepted .acknowledged=${["summary"]}></tc-handoff-brief>
      </div>`);
      await wait(400);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
