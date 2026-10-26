/*
 * <tc-agent-team> in real browsers – the illustration's contract and regression checks, ported: the prompt types
 * itself without a render per letter, the loop holds in hidden tabs and off screen and starts over when it's back,
 * it rests after three rounds; plus its description, theme and accessibility.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/agent-team";
import { TcAgentTeam, type AgentTeamMember } from "../../src/elements/agent-team";
import { AgentTeam } from "../../src/elements/react/agent-team";
import { cleanup, fixture, settle } from "./helpers";

const face = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
const members: AgentTeamMember[] = [
  { role: "Researcher", avatar: face, tools: ["linkedin"] },
  { role: "SDR", avatar: face, tools: ["gmail", "hubspot"] },
  { role: "Ops", avatar: face },
];

let hidden = false;
beforeEach(() => {
  hidden = false;
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  // @ts-expect-error – drop the own-property override, back to the prototype's getter
  delete document.visibilityState;
  cleanup();
});

const fake = () => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
const advance = async (ms: number) => {
  for (let t = 0; t < ms; t += 50) {
    vi.advanceTimersByTime(50);
    await Promise.resolve();
  }
};
const setHidden = async (h: boolean) => {
  hidden = h;
  document.dispatchEvent(new Event("visibilitychange"));
  await Promise.resolve();
  await Promise.resolve();
};
/** Counts the element's renders from now on */
const countUpdates = (el: TcAgentTeam) => {
  const counter = { n: 0 };
  const own = el as unknown as { update: (changed: unknown) => void };
  const update = own.update.bind(el);
  own.update = (changed) => {
    counter.n++;
    update(changed);
  };
  return counter;
};

describe("tc-agent-team", () => {
  test("the host is the root and an image described by the prompt and the roles; a label wins", async () => {
    const el = await fixture<TcAgentTeam>(html`<tc-agent-team prompt="Build a team" .members=${members}></tc-agent-team>`);
    expect(el.dataset.ui).toBe("at");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("A prompt – “Build a team” – builds a team of three agents: Researcher, SDR, Ops");
    el.label = "Three agents";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Three agents");
  });

  test("agents show their role and up to two tool logos", async () => {
    const el = await fixture<TcAgentTeam>(html`<tc-agent-team .members=${members}></tc-agent-team>`);
    const agents = [...el.querySelectorAll(".ui-at-agent")];
    expect(agents.map((a) => a.querySelector(".ui-at-role")!.textContent!.trim())).toEqual(["Researcher", "SDR", "Ops"]);
    expect(agents.map((a) => a.querySelectorAll(".ui-at-tool svg svg, .ui-at-tool svg path").length > 0)).toEqual([true, true, false]);
    expect(agents.map((a) => a.querySelectorAll(".ui-at-tool").length)).toEqual([1, 2, 0]);
    expect((agents[2] as HTMLElement).style.getPropertyValue("--i")).toBe("2");
  });

  test("each instance has its own reveal masks", async () => {
    const wrap = await fixture(html`<div><tc-agent-team .members=${members}></tc-agent-team><tc-agent-team .members=${members}></tc-agent-team></div>`);
    const [a, b] = [...wrap.querySelectorAll("tc-agent-team")];
    const ids = (el: Element) => [...el.querySelectorAll("mask")].map((m) => m.id);
    expect(ids(a)).toHaveLength(3);
    expect(ids(a).filter((id) => ids(b).includes(id))).toEqual([]);
    for (const el of [a, b]) for (const p of el.querySelectorAll(".ui-at-line")) expect(el.querySelector(`[id="${p.getAttribute("mask")!.slice(5, -1)}"]`)).toBeTruthy();
  });

  test("types the prompt and moves through the phases without re-rendering", async () => {
    fake();
    const el = await fixture<TcAgentTeam>(html`<tc-agent-team prompt="Build a team" .members=${members}></tc-agent-team>`);
    const renders = countUpdates(el);
    expect(el.dataset.phase).toBe("typing");
    await advance(1000);
    expect(el.querySelector(".ui-at-text")!.textContent).toBe("Build a team");
    await advance(1500);
    expect(el.dataset.phase).toBe("team");
    expect(renders.n).toBe(0);
  });

  test("holds still while the tab is hidden and starts over when it's back; removing it clears its timers", async () => {
    fake();
    const el = await fixture<TcAgentTeam>(html`<tc-agent-team prompt="Build a team" .members=${members}></tc-agent-team>`);
    await advance(200);
    await setHidden(true);
    await el.updateComplete;
    expect(vi.getTimerCount()).toBe(0);
    await setHidden(false);
    await el.updateComplete;
    expect(el.dataset.phase).toBe("typing");
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("starts over three times, then rests on the finished team (WCAG 2.2.2)", async () => {
    fake();
    const el = await fixture<TcAgentTeam>(html`<tc-agent-team prompt="Build a team" .members=${members}></tc-agent-team>`);
    let resets = 0;
    new MutationObserver(() => el.dataset.phase === "reset" && resets++).observe(el, { attributeFilter: ["data-phase"] });
    await advance(3 * 7000);
    expect(el.dataset.phase).toBe("team");
    expect(resets).toBe(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("a new prompt starts the scene over", async () => {
    fake();
    const el = await fixture<TcAgentTeam>(html`<tc-agent-team prompt="Build a team" .members=${members}></tc-agent-team>`);
    await advance(2500);
    expect(el.dataset.phase).toBe("team");
    el.prompt = "Hire";
    await el.updateComplete;
    expect(el.dataset.phase).toBe("typing");
    await advance(700);
    expect(el.querySelector(".ui-at-text")!.textContent).toBe("Hire");
  });

  test("off screen it waits; on screen it types", async () => {
    const el = await fixture<TcAgentTeam>(html`<tc-agent-team prompt="Build a team" .members=${members} style="position: absolute; top: 5000px; width: 300px"></tc-agent-team>`);
    await new Promise((r) => setTimeout(r, 800));
    expect(el.querySelector(".ui-at-text")!.textContent).toBe("");
    el.style.top = "0";
    await expect.poll(() => el.querySelector(".ui-at-text")!.textContent, { timeout: 3000 }).toBe("Build a team");
  });

  test("reduced motion shows the finished team, with no timers", async () => {
    fake();
    const real = window.matchMedia.bind(window);
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => (q.includes("prefers-reduced-motion") ? ({ matches: true, media: q } as MediaQueryList) : real(q)));
    const el = await fixture<TcAgentTeam>(html`<tc-agent-team prompt="Build a team" .members=${members}></tc-agent-team>`);
    expect(el.dataset.phase).toBe("team");
    expect(el.querySelector(".ui-at-text")!.textContent).toBe("Build a team");
    expect(vi.getTimerCount()).toBe(0);
  });

  test("dark follows color-scheme alone; the only endless loop is the caret, which blinks only while typing", async () => {
    const css = TcAgentTeam.css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    for (const [rule] of css.matchAll(/animation:[^;]*\binfinite\b[^;]*;/g)) expect(rule).toMatch(/ui-at-blink/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-agent-team .members=${members}></tc-agent-team></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-at-caret")!).backgroundColor).toBe("rgb(237, 237, 237)");
  });

  test("React wrapper: className is merged, DOM props reach the host, and the ref gets the host", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcAgentTeam>();
    const team = members as [AgentTeamMember, AgentTeamMember, AgentTeamMember];
    await act(async () =>
      root.render(React.createElement(AgentTeam, { members: team, className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", ref } as React.ComponentProps<typeof AgentTeam>)),
    );
    await settle();
    const el = host.querySelector<TcAgentTeam>("tc-agent-team")!;
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.ui).toBe("at");
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
  });

  test("axe: no violations on the finished scene", async () => {
    const real = window.matchMedia.bind(window);
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => (q.includes("prefers-reduced-motion") ? ({ matches: true, media: q } as MediaQueryList) : real(q)));
    const wrap = await fixture(html`<div><tc-agent-team .members=${members}></tc-agent-team></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
