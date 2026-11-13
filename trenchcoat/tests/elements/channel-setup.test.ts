/*
 * <tc-channel-setup> in real browsers: the step list, each step's check and error in words, connect, search and pick,
 * reply modes and business hours, the test, going live, controlled step and value, narrow width, the React wrapper and
 * axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/channel-setup";
import { channelStepProblem, type ChannelSetupValue, type TcChannelSetup } from "../../src/elements/channel-setup";
import { ChannelSetup } from "../../src/elements/react/channel-setup";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const TARGETS = [
  { id: "policy", label: "#policy-questions", detail: "214 members" },
  { id: "starters", label: "#new-starters", detail: "38 members" },
  { id: "travel", label: "#travel-and-expenses" },
];
const VALUE: ChannelSetupValue = { targets: [], replies: "mentions", hours: { from: "09:00", to: "17:00", timeZone: "Europe/London" } };
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcChannelSetup>(
    html`<tc-channel-setup look=${look} heading="Put Policy Q&amp;A in team chat" channel="Team chat" agent="Policy Q&amp;A" .targets=${TARGETS} .value=${VALUE}></tc-channel-setup>`,
  );
const next = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-chs__next")!;
const press = async (el: TcChannelSetup, b: HTMLElement) => {
  b.click();
  await settle();
};
const steps = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-chs__step")].map((s) => s.dataset.state);
const error = (el: Element) => el.querySelector(".ui-chs__error")?.textContent?.trim() ?? "";

describe("tc-channel-setup", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a step list, the first step's heading and Next`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("chs");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("nav")!.getAttribute("aria-label")).toBe("Setup steps");
      expect([...el.querySelectorAll(".ui-chs__step-name")].map((s) => s.textContent)).toEqual(["Connect", "Where", "When it replies", "Test", "Go live"]);
      expect(steps(el)).toEqual(["current", "upcoming", "upcoming", "upcoming", "upcoming"]);
      expect(el.querySelector('[aria-current="step"]')!.getAttribute("data-step")).toBe("connect");
      expect(el.querySelector(".ui-chs__heading")!.textContent).toBe("Connect an account");
      expect(el.querySelector(".ui-chs__back")).toBeNull();
      expect(next(el).textContent!.trim()).toBe("Next");
    });
  }

  test("the checks, as a function", () => {
    const ctx = { account: "", value: VALUE, testResult: null };
    expect(channelStepProblem("connect", ctx)).toBe("connect");
    expect(channelStepProblem("connect", { ...ctx, account: "A" })).toBe("");
    expect(channelStepProblem("where", ctx)).toBe("where");
    expect(channelStepProblem("when", ctx)).toBe("");
    const hours = (from: string, to: string, timeZone = "UTC") => channelStepProblem("when", { ...ctx, value: { ...VALUE, replies: "hours", hours: { from, to, timeZone } } });
    expect(hours("", "17:00")).toBe("hoursMissing");
    expect(hours("17:00", "09:00")).toBe("hoursOrder");
    expect(hours("09:00", "17:00", "")).toBe("timeZone");
    expect(hours("09:00", "17:00")).toBe("");
    expect(channelStepProblem("test", ctx)).toBe("test");
    expect(channelStepProblem("test", { ...ctx, testResult: { ok: false } })).toBe("testFailed");
    expect(channelStepProblem("test", { ...ctx, testResult: { ok: true } })).toBe("");
  });

  test("Connect asks the page, waits, and Next says what's missing until there's an account", async () => {
    const el = await make();
    await press(el, next(el));
    expect(error(el)).toBe("Connect an account to continue.");
    expect(el.querySelector('[role="status"].tc-sr-only')!.textContent).toBe("Connect an account to continue.");
    const connect = el.querySelector<HTMLButtonElement>(".ui-chs__connect .ui-chs__primary")!;
    await expect.poll(() => document.activeElement).toBe(connect);
    expect(connect.getAttribute("aria-describedby")).toBe(el.querySelector(".ui-chs__error")!.id);
    expect(connect.textContent!.replace(/\s+/g, " ").trim()).toBe("Connect Team chat");
    let asked = 0;
    el.addEventListener("tc-connect", () => asked++);
    await press(el, connect);
    await press(el, connect);
    expect(asked).toBe(1);
    expect(el.querySelector(".ui-chs__connect .ui-chs__primary")!.getAttribute("aria-disabled")).toBe("true");
    el.account = "Research Institute workspace";
    await settle();
    expect(el.connecting).toBe(false);
    expect(el.querySelector(".ui-chs__connected")!.textContent!.trim()).toBe("Connected as Research Institute workspace");
    expect(el.querySelector(".ui-chs__error")).toBeNull();
    await press(el, next(el));
    expect(el.step).toBe("where");
    await expect.poll(() => document.activeElement === el.querySelector(".ui-chs__heading")).toBe(true);
    expect(steps(el)).toEqual(["done", "current", "upcoming", "upcoming", "upcoming"]);
  });

  test("Where: search filters, ticks change the value, an empty pick stops Next", async () => {
    const el = await make();
    el.account = "A";
    el.step = "where";
    await settle();
    const values: ChannelSetupValue[] = [];
    el.addEventListener("tc-value-change", (e) => values.push((e as CustomEvent).detail.value));
    await press(el, next(el));
    expect(error(el)).toBe("Pick at least one place for the agent to reply in.");
    await expect.poll(() => (document.activeElement as HTMLInputElement | null)?.type).toBe("checkbox");
    const search = el.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = "new";
    search.dispatchEvent(new Event("input"));
    await settle();
    expect([...el.querySelectorAll(".ui-chs__target-label")].map((t) => t.textContent)).toEqual(["#new-starters"]);
    await press(el, el.querySelector<HTMLInputElement>('.ui-chs__targets input[type="checkbox"]')!);
    expect(el.value.targets).toEqual(["starters"]);
    expect(el.querySelector(".ui-chs__count")!.textContent).toBe("1 selected");
    search.value = "zzz";
    search.dispatchEvent(new Event("input"));
    await settle();
    expect(el.querySelector(".ui-chs__none")!.textContent).toBe("Nothing matches “zzz”");
    // A prevented change leaves the box as the value says
    search.value = "";
    search.dispatchEvent(new Event("input"));
    await settle();
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    const policy = el.querySelector<HTMLInputElement>('.ui-chs__targets input[type="checkbox"]')!;
    await press(el, policy);
    expect(el.value.targets).toEqual(["starters"]);
    await expect.poll(() => policy.checked).toBe(false);
    expect(values.map((v) => v.targets)).toEqual([["starters"], ["starters", "policy"]]);
  });

  test("When: the modes are radios with explanations; business hours need a sensible range", async () => {
    const el = await make();
    el.account = "A";
    el.value = { ...VALUE, targets: ["policy"] };
    el.step = "when";
    await settle();
    const radios = [...el.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    expect(radios.map((r) => r.closest("label")!.querySelector(".ui-chs__radio-label")!.textContent)).toEqual(["Every message", "When mentioned", "Only in direct messages", "During business hours"]);
    expect(radios[1].checked).toBe(true);
    expect(document.getElementById(radios[0].getAttribute("aria-describedby")!)!.textContent).toBe("Answers each message in the places you picked.");
    await press(el, radios[3]);
    expect(el.value.replies).toBe("hours");
    const [from, to] = [...el.querySelectorAll<HTMLInputElement>('input[type="time"]')];
    to.value = "08:00";
    to.dispatchEvent(new Event("change"));
    await settle();
    await press(el, next(el));
    expect(error(el)).toBe("The end time must be after the start time.");
    await expect.poll(() => document.activeElement).toBe(from);
    expect(from.getAttribute("aria-describedby")).toBeTruthy();
    const zone = el.querySelector<HTMLSelectElement>("select")!;
    expect(zone.value).toBe("Europe/London");
    to.value = "17:30";
    to.dispatchEvent(new Event("change"));
    await settle();
    await press(el, next(el));
    expect(el.step).toBe("test");
  });

  test("Test: sends through the page, waits for its result, and needs a reply to pass", async () => {
    const el = await make();
    Object.assign(el, { account: "A", value: { ...VALUE, targets: ["policy"] }, step: "test" });
    await settle();
    await press(el, next(el));
    expect(error(el)).toBe("Send a test message first.");
    const sent: unknown[] = [];
    el.addEventListener("tc-test", (e) => sent.push((e as CustomEvent).detail.message));
    const input = el.querySelector<HTMLInputElement>(".ui-chs__test input")!;
    input.value = "What's the travel policy?";
    input.dispatchEvent(new Event("input"));
    const send = el.querySelector<HTMLButtonElement>(".ui-chs__test-row button")!;
    await press(el, send);
    await press(el, send);
    expect(sent).toEqual(["What's the travel policy?"]);
    expect(send.textContent).toContain("Sending…");
    el.testResult = { ok: false, message: "The bot isn't in #policy-questions yet." };
    await settle();
    expect(el.testing).toBe(false);
    expect(el.querySelector(".ui-chs__result-card")!.getAttribute("data-ok")).toBe("false");
    expect(el.querySelector(".ui-chs__result")!.getAttribute("role")).toBe("status");
    await press(el, next(el));
    expect(error(el)).toBe("The test didn't get a reply. Fix the problem and send another.");
    el.testResult = { ok: true, reply: "Hi! Ask me about travel." };
    await settle();
    expect(el.querySelector(".ui-chs__result-reply")!.textContent).toBe("Hi! Ask me about travel.");
    await press(el, next(el));
    expect(el.step).toBe("live");
  });

  test("Go live: a summary, then the done state – or not, when prevented; Back and the step list go back", async () => {
    const el = await make();
    Object.assign(el, { account: "Research Institute workspace", value: { ...VALUE, targets: ["policy", "travel"], replies: "hours" }, testResult: { ok: true }, step: "live" });
    await settle();
    const dds = [...el.querySelectorAll(".ui-chs__summary dd")].map((d) => d.textContent);
    expect(dds).toEqual(["Research Institute workspace", "#policy-questions, #travel-and-expenses", "During business hours, 09:00–17:00 (Europe/London)", "It replied"]);
    expect(next(el).textContent!.trim()).toBe("Go live");
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-go-live", stop);
    await press(el, next(el));
    expect(el.live).toBe(false);
    el.removeEventListener("tc-go-live", stop);
    // Every earlier step was reached, so each is a button back
    expect(el.querySelectorAll("button.ui-chs__step-btn")).toHaveLength(4);
    await press(el, el.querySelector<HTMLButtonElement>('[data-step="where"] button')!);
    expect(el.step).toBe("where");
    await press(el, el.querySelector<HTMLButtonElement>(".ui-chs__back")!);
    expect(el.step).toBe("connect");
    el.step = "live";
    await settle();
    let went: unknown = null;
    el.addEventListener("tc-go-live", (e) => (went = (e as CustomEvent).detail.account));
    await press(el, next(el));
    expect(went).toBe("Research Institute workspace");
    expect(el.live).toBe(true);
    expect(el.querySelector(".ui-chs__done-text")!.textContent).toBe("Policy Q&A is live in Team chat");
    expect(steps(el).every((s) => s === "done")).toBe(true);
    expect(el.querySelector('[role="status"].tc-sr-only')!.textContent).toBe("Policy Q&A is live in Team chat");
  });

  test("a prevented step change stays; narrow shows Step n of 5; renamed words", async () => {
    const el = await make();
    el.account = "A";
    el.labels = { steps: { where: "Rooms" }, next: "Continue" };
    await settle();
    expect(next(el).textContent!.trim()).toBe("Continue");
    el.addEventListener("tc-step-change", (e) => e.preventDefault(), { once: true });
    await press(el, next(el));
    expect(el.step).toBe("connect");
    await press(el, next(el));
    expect(el.step).toBe("where");
    el.style.width = "360px";
    await settle();
    expect(getComputedStyle(el.querySelector(".ui-chs__steps")!).display).toBe("none");
    expect(el.querySelector(".ui-chs__step-of")!.textContent).toBe("Step 2 of 5 · Rooms");
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React: uncontrolled keeps its step across re-renders; controlled waits for the parent", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const render = (props: Partial<React.ComponentProps<typeof ChannelSetup>>) =>
      act(async () => root.render(React.createElement(ChannelSetup, { targets: TARGETS, account: "A", ...props })));
    await render({});
    const el = wrap.querySelector<TcChannelSetup>("tc-channel-setup")!;
    await settle();
    await act(async () => next(el).click());
    await settle();
    expect(el.step).toBe("where");
    await act(async () => el.querySelector<HTMLInputElement>('.ui-chs__targets input[type="checkbox"]')!.click());
    await settle();
    await render({ description: "Again" });
    await settle();
    expect(el.step).toBe("where");
    expect(el.value.targets).toEqual(["policy"]);
    const steps: string[] = [];
    let tested = "";
    await render({ step: "connect", onStepChange: (s) => void steps.push(s), onTest: (m) => void (tested = m) });
    await settle();
    await act(async () => next(el).click());
    await settle();
    expect(steps).toEqual(["where"]);
    await expect.poll(() => el.step).toBe("connect");
    await render({ step: "test", onTest: (m) => ((tested = m), false) });
    await settle();
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-chs__test-row button")!.click());
    await settle();
    expect(tested).toBe("Hello! Can you tell me what you help with?");
    expect(el.testing).toBe(false);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, on every step and with an error`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.colorScheme = theme;
      for (const step of ["connect", "where", "when", "test", "live"] as const) {
        wrap.innerHTML = `<tc-channel-setup look="standard" heading="A"></tc-channel-setup><tc-channel-setup look="clean" heading="B"></tc-channel-setup>`;
        const els = [...wrap.querySelectorAll<TcChannelSetup>("tc-channel-setup")];
        els.forEach((el) =>
          Object.assign(el, { targets: TARGETS, account: step === "connect" ? "" : "A", step, value: { ...VALUE, replies: "hours" }, testResult: step === "test" ? { ok: false, message: "Not in the room." } : null }),
        );
        await settle(wrap);
        if (step === "connect" || step === "where") els.forEach((el) => next(el).click());
        await settle(wrap);
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${step} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      }
    });
  }
});
