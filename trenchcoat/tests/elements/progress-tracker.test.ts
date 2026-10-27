/*
 * <tc-progress-tracker> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ProgressTracker } from "../../src/elements/react/progress-tracker";
import "../../src/elements/progress-tracker";
import type { ProgressDoneChange, ProgressStep, TcProgressTracker } from "../../src/elements/progress-tracker";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const steps: ProgressStep[] = [
  { id: "a", label: "Connect your inbox", done: true },
  { id: "b", label: "Invite a teammate" },
];
const three: ProgressStep[] = [
  { id: "a", label: "One" },
  { id: "b", label: "Two" },
  { id: "c", label: "Three" },
];
const box = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>('[role="checkbox"]')].find((b) => b.textContent!.trim() === name)!;
const checked = (el: Element) => [...el.querySelectorAll('[role="checkbox"]')].map((b) => b.getAttribute("aria-checked"));
const bar = (el: Element) => el.querySelector('[role="progressbar"]')!;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("tc-progress-tracker", () => {
  test("the host is the root; the bar is named by the heading and says the count", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${steps}></tc-progress-tracker>`);
    expect(el.dataset.ui).toBe("progress");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector("h3")!.textContent).toBe("Getting started");
    expect(bar(el).getAttribute("aria-label")).toBe("Getting started");
    expect(bar(el).getAttribute("aria-valuetext")).toBe("1 of 2 done");
    expect(el.hasAttribute("data-complete")).toBe(false);
  });

  test("the header comes first – on the tray above the card in Standard, the card's first row in Clean – and holds the count", async () => {
    for (const look of ["standard", "clean"] as const) {
      const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker look=${look} .steps=${steps}></tc-progress-tracker>`);
      const head = el.querySelector(":scope > .tc-head:first-child")!;
      expect(head.querySelector("h3.tc-head__title")!.textContent).toBe("Getting started");
      expect(head.querySelector(".tc-head__aside .ui-progress__count")!.textContent).toBe("1/2");
      expect(el.querySelector(":scope > .tc-head + .ui-progress__body > [role='progressbar'] + .ui-progress__list")).toBeTruthy();
      cleanup();
    }
  });

  test("a toggle fires tc-done-change once with the ids and every step's flag", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${steps}></tc-progress-tracker>`);
    const onChange = vi.fn();
    el.addEventListener("tc-done-change", (e) => onChange((e as CustomEvent<ProgressDoneChange>).detail));
    box(el, "Invite a teammate").click();
    await settle();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.lastCall![0].done).toEqual(["a", "b"]);
    expect(onChange.mock.lastCall![0].steps.map((s: ProgressStep) => s.done)).toEqual([true, true]);
    expect(el.hasAttribute("data-complete")).toBe(true);
    box(el, "Connect your inbox").click();
    await settle();
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.lastCall![0].steps.map((s: ProgressStep) => s.done)).toEqual([false, true]);
  });

  test("controlled done: preventDefault reports without applying; setting done shows it", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${steps} .done=${[]}></tc-progress-tracker>`);
    const onChange = vi.fn();
    el.addEventListener("tc-done-change", (e) => {
      e.preventDefault();
      onChange((e as CustomEvent<ProgressDoneChange>).detail.done);
    });
    box(el, "Invite a teammate").click();
    await settle();
    expect(onChange).toHaveBeenCalledWith(["b"]);
    expect(box(el, "Invite a teammate").getAttribute("aria-checked")).toBe("false");
    for (const value of [["a"], ["a", "b"]]) {
      el.done = value;
      await settle();
      expect(checked(el)).toEqual(steps.map((s) => (value.includes(s.id) ? "true" : "false")));
    }
  });

  test("uncontrolled: steps added later render, and changed step flags win over local ticks", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${steps}></tc-progress-tracker>`);
    box(el, "Invite a teammate").click();
    await settle();
    el.steps = [...steps, { id: "c", label: "Ship it" }];
    await settle();
    expect(box(el, "Invite a teammate").getAttribute("aria-checked")).toBe("true");
    expect(bar(el).getAttribute("aria-valuetext")).toBe("2 of 3 done");
    el.steps = [{ ...steps[0], done: false }, steps[1], { id: "c", label: "Ship it", done: true }];
    await settle();
    expect(bar(el).getAttribute("aria-valuetext")).toBe("1 of 3 done");
    expect(box(el, "Ship it").getAttribute("aria-checked")).toBe("true");
  });

  test("defaultDone sets the first ticks", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${three} .defaultDone=${["b", "c"]}></tc-progress-tracker>`);
    expect(checked(el)).toEqual(["false", "true", "true"]);
  });

  test("auto-play switched on after mount starts playing", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${steps} interval="60"></tc-progress-tracker>`);
    await wait(200);
    expect(bar(el).getAttribute("aria-valuenow")).toBe("1");
    el.autoPlay = true;
    await settle();
    await wait(110);
    expect(bar(el).getAttribute("aria-valuenow")).toBe("2");
  });

  test("WCAG 2.2.2: auto-play has one Pause / Play button that stops and restarts it and keeps focus", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${three} interval="150" auto-play></tc-progress-tracker>`);
    await wait(220);
    expect(bar(el).getAttribute("aria-valuenow")).toBe("1");
    const pause = el.querySelector<HTMLButtonElement>(".ui-progress__play")!;
    expect(pause.getAttribute("aria-label")).toBe("Pause auto-play");
    pause.focus();
    pause.click();
    await settle();
    await wait(400);
    expect(bar(el).getAttribute("aria-valuenow")).toBe("1");
    const play = el.querySelector<HTMLButtonElement>(".ui-progress__play")!;
    expect(play).toBe(pause);
    expect(play.getAttribute("aria-label")).toBe("Play auto-play");
    expect(document.activeElement).toBe(play);
    play.click();
    await settle();
    await wait(220);
    expect(bar(el).getAttribute("aria-valuenow")).toBe("2");
  });

  test("an interaction stops auto-play", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${three} interval="60" auto-play></tc-progress-tracker>`);
    box(el, "Three").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    await wait(250);
    expect(bar(el).getAttribute("aria-valuenow")).toBe("0");
    expect(el.querySelector(".ui-progress__play")!.getAttribute("aria-label")).toBe("Play auto-play");
  });

  test("no Pause button without auto-play", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${three}></tc-progress-tracker>`);
    expect(el.querySelector(".ui-progress__play")).toBeNull();
  });

  test("reduced motion: auto-play doesn't tick on its own", async () => {
    const real = window.matchMedia.bind(window);
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => (q.includes("reduce") ? ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList) : real(q)));
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${three} interval="40" auto-play></tc-progress-tracker>`);
    await wait(200);
    expect(bar(el).getAttribute("aria-valuenow")).toBe("0");
    expect(el.querySelector(".ui-progress__play")!.getAttribute("aria-label")).toBe("Play auto-play");
  });

  test("no timer left behind when removed", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${three} interval="40" auto-play></tc-progress-tracker>`);
    const onChange = vi.fn();
    el.addEventListener("tc-done-change", onChange);
    el.remove();
    await wait(150);
    expect(onChange).not.toHaveBeenCalled();
  });

  test("keyboard: Space and Enter tick a step", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${three}></tc-progress-tracker>`);
    box(el, "One").focus();
    await userEvent.keyboard(" ");
    await settle();
    box(el, "Two").focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(checked(el)).toEqual(["true", "true", "false"]);
  });

  test("an icon element is cloned", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("data-mine", "");
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${[{ id: "a", label: "A", icon }]}></tc-progress-tracker>`);
    expect(el.querySelector(".ui-progress__icon svg[data-mine]")).toBeTruthy();
    expect(icon.isConnected).toBe(false);
  });

  test("1.4.10 / 1.4.11 / performance: labels wrap, the unchecked ring is a control edge, the shine uses transform", () => {
    const css = (customElements.get("tc-progress-tracker") as unknown as typeof TcProgressTracker).css;
    expect(css).not.toMatch(/\.ui-progress__label \{[^}]*nowrap/);
    expect(css).toMatch(/ui-progress__check \{[^}]*--tc-border-control/);
    expect(css).not.toMatch(/background-position/);
  });

  const states: ProgressStep[] = [
    { id: "a", label: "Upload the files", done: true },
    { id: "b", label: "Scan for secrets", state: "failed" },
    { id: "c", label: "Build the index", state: "pending" },
    { id: "d", label: "Invite reviewers", disabled: true },
    { id: "e", label: "Publish" },
  ];

  test("failed and pending steps say so, don't count as done and can't be ticked", async () => {
    const onDone = vi.fn();
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${[...states.slice(0, 2), { ...states[2], done: true }]} @tc-done-change=${onDone}></tc-progress-tracker>`);
    expect(el.querySelectorAll('[role="checkbox"]').length).toBe(1);
    const failed = el.querySelector<HTMLElement>('[data-status="failed"]')!;
    expect(failed.tagName).toBe("DIV");
    expect(failed.textContent!.replace(/\s+/g, " ").trim()).toBe("Scan for secrets, Failed");
    expect(failed.querySelector(".ui-progress__check svg path")).toBeTruthy();
    const pending = el.querySelector<HTMLElement>('[data-status="pending"]')!;
    expect(pending.textContent!.replace(/\s+/g, " ").trim()).toBe("Build the index, In progress");
    failed.click();
    await settle();
    expect(onDone).not.toHaveBeenCalled();
    // A pending step's done flag doesn't count
    expect(bar(el).getAttribute("aria-valuetext")).toBe("1 of 3 done");
  });

  test("a disabled step stays focusable with aria-disabled and ignores clicks and keys", async () => {
    const onDone = vi.fn();
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${states} @tc-done-change=${onDone}></tc-progress-tracker>`);
    const step = box(el, "Invite reviewers");
    expect(step.getAttribute("aria-disabled")).toBe("true");
    expect(step.disabled).toBe(false);
    step.click();
    step.focus();
    await userEvent.keyboard(" ");
    await settle();
    expect(onDone).not.toHaveBeenCalled();
    expect(step.getAttribute("aria-checked")).toBe("false");
    box(el, "Publish").click();
    await settle();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test("readonly: a status list – no checkboxes, the state in words, no auto play", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker readonly auto-play interval="20" .steps=${states}></tc-progress-tracker>`);
    expect(el.querySelectorAll('[role="checkbox"], button.ui-progress__step').length).toBe(0);
    expect(el.querySelector(".ui-progress__play")).toBeNull();
    const rows = [...el.querySelectorAll(".ui-progress__step")].map((r) => r.textContent!.replace(/\s+/g, " ").trim());
    expect(rows).toEqual(["Upload the files, done", "Scan for secrets, Failed", "Build the index, In progress", "Invite reviewers, not done", "Publish, not done"]);
    await wait(120);
    expect(bar(el).getAttribute("aria-valuenow")).toBe("1");
  });

  test("a step's own readonly makes just that row a status row", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker .steps=${[{ id: "a", label: "A", done: true, readonly: true }, { id: "b", label: "B" }]}></tc-progress-tracker>`);
    expect(el.querySelectorAll('[role="checkbox"]').length).toBe(1);
    expect(el.querySelector('div[data-status="done"]')!.textContent).toContain(", done");
  });

  test("auto play skips steps it can't tick", async () => {
    const el = await fixture<TcProgressTracker>(html`<tc-progress-tracker auto-play interval="80" .steps=${states}></tc-progress-tracker>`);
    await wait(130);
    expect(box(el, "Invite reviewers").getAttribute("aria-checked")).toBe("false");
    expect(box(el, "Publish").getAttribute("aria-checked")).toBe("true");
  });

  test("done-style plain: no line through done steps; fit widens or fills", async () => {
    const wrap = await fixture(html`<div style="width: 900px">
      <tc-progress-tracker .steps=${steps}></tc-progress-tracker>
      <tc-progress-tracker done-style="plain" fit="wide" .steps=${steps}></tc-progress-tracker>
      <tc-progress-tracker look="clean" done-style="plain" fit="fill" .steps=${steps}></tc-progress-tracker>
    </div>`);
    for (const a of wrap.getAnimations({ subtree: true })) a.finish();
    const [strike, plain, fill] = [...wrap.querySelectorAll<TcProgressTracker>("tc-progress-tracker")];
    const line = (el: Element) => getComputedStyle(el.querySelector('[data-status="done"] .ui-progress__label > span')!).backgroundSize;
    expect(line(strike)).toMatch(/^100%/);
    expect(line(plain)).toMatch(/^0%/);
    expect(line(fill)).toMatch(/^0%/);
    expect(strike.getBoundingClientRect().width).toBe(360);
    expect(plain.getBoundingClientRect().width).toBe(560);
    expect(fill.getBoundingClientRect().width).toBe(900);
    expect(plain.doneStyle).toBe("plain");
  });

  test("the wrapper: readonly, doneStyle, fit and step states reach the element", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(ProgressTracker, { title: "Import", steps: states as React.ComponentProps<typeof ProgressTracker>["steps"], readonly: true, doneStyle: "plain", fit: "wide" })));
    await settle();
    const el = host.querySelector("tc-progress-tracker")!;
    expect(el.getAttribute("fit")).toBe("wide");
    expect(el.getAttribute("done-style")).toBe("plain");
    expect(el.querySelectorAll('[role="checkbox"]').length).toBe(0);
    expect(el.querySelector('[data-status="failed"]')).toBeTruthy();
    await act(async () => root.unmount());
  });

  for (const scheme of ["light", "dark"] as const)
    test(`axe: the step states in both looks (${scheme})`, async () => {
      const wrap = await fixture(html`<div style=${`color-scheme: ${scheme}`}>
        <tc-progress-tracker .steps=${states}></tc-progress-tracker>
        <tc-progress-tracker look="clean" readonly heading="Clean" .steps=${states}></tc-progress-tracker>
      </div>`);
      for (const a of wrap.getAnimations({ subtree: true })) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-progress-tracker .steps=${steps} auto-play interval="100000"></tc-progress-tracker>
      <tc-progress-tracker look="clean" heading="Clean" .steps=${steps}></tc-progress-tracker>
    </div>`);
    // The heading fades in: check the settled colours
    for (const a of wrap.getAnimations({ subtree: true })) a.finish();
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
