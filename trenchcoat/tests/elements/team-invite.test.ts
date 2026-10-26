/*
 * <tc-team-invite> in real browsers – the illustration's contract checks, ported, plus its description, motion,
 * theme and accessibility behaviour.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/team-invite";
import { TcTeamInvite, type TeamInviteAvatar } from "../../src/elements/team-invite";
import { TeamInvite } from "../../src/elements/react/team-invite";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const face = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
const named: TeamInviteAvatar[] = [
  { src: face, name: "Maya" },
  { src: face, name: "Jonas" },
  { src: face, name: "Priya" },
];
const unnamed: TeamInviteAvatar[] = [{ src: face }, { src: face }, { src: face }];

describe("tc-team-invite", () => {
  test("the host is the root and an image described by the avatars' names", async () => {
    const el = await fixture<TcTeamInvite>(html`<tc-team-invite .avatars=${named}></tc-team-invite>`);
    expect(el.dataset.ui).toBe("ti");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Maya and Jonas are connected; Priya is dragged into the empty slot and joins the team");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
    const imgs = [...el.querySelectorAll("img")];
    expect(imgs).toHaveLength(3);
    expect(imgs.every((img) => img.alt === "" && img.getAttribute("src") === face)).toBe(true);
    // The invited one is carried by the drag
    expect(el.querySelector(".ui-ti-drag .ui-ti-node--c img")).toBeTruthy();
  });

  test("missing names read as Teammate n; a label wins; without either it's decorative", async () => {
    const el = await fixture<TcTeamInvite>(html`<tc-team-invite .avatars=${[{ src: face, name: "Maya" }, { src: face }, { src: face }]}></tc-team-invite>`);
    expect(el.getAttribute("aria-label")).toBe("Maya and Teammate 2 are connected; Teammate 3 is dragged into the empty slot and joins the team");
    el.label = "A new teammate joins";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("A new teammate joins");
    el.label = undefined;
    el.avatars = unnamed;
    await settle();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.hasAttribute("aria-label")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("each instance has its own line gradient", async () => {
    const wrap = await fixture(html`<div><tc-team-invite .avatars=${unnamed}></tc-team-invite><tc-team-invite .avatars=${unnamed}></tc-team-invite></div>`);
    const [a, b] = [...wrap.querySelectorAll("tc-team-invite")];
    const idOf = (el: Element) => el.querySelector("linearGradient")!.id;
    expect(idOf(a)).not.toBe(idOf(b));
    for (const el of [a, b]) for (const p of el.querySelectorAll("[stroke^='url(']")) expect(p.getAttribute("stroke")).toBe(`url(#${idOf(el)})`);
  });

  test("the loop is finite: it stops on the finished team (WCAG 2.2.2)", async () => {
    const el = await fixture<TcTeamInvite>(html`<tc-team-invite .avatars=${unnamed} style="width: 300px"></tc-team-invite>`);
    const drag = getComputedStyle(el.querySelector(".ui-ti-drag")!);
    expect(drag.animationName).toBe("ui-ti-drag");
    expect(drag.animationIterationCount).toBe("2.7");
    expect(drag.animationFillMode).toBe("forwards");
    expect(TcTeamInvite.css).not.toMatch(/\binfinite\b/);
  });

  test("off screen the loop holds (data-paused), and runs on when it's back", async () => {
    const el = await fixture<TcTeamInvite>(html`<tc-team-invite .avatars=${unnamed} style="position: absolute; top: 5000px; width: 300px"></tc-team-invite>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-ti-cursor")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
    expect(getComputedStyle(el.querySelector(".ui-ti-cursor")!).animationPlayState).toBe("running");
  });

  test("reduced motion shows the waiting state still; dark follows color-scheme alone", () => {
    const css = TcTeamInvite.css;
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[^}]*\.ui-ti-drag[^{]*\{ animation: none; \}\s*\.ui-ti-node--c \.ui-ti-dot \{ transform: scale\(0\); \}/);
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
  });

  test("dark theme: the slot's plus takes its dark colour", async () => {
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-team-invite .avatars=${unnamed}></tc-team-invite></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-ti-plus")!).stroke).toBe("rgb(92, 92, 97)");
  });

  test("React wrapper: className is merged, DOM props reach the host, and the ref gets the host", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcTeamInvite>();
    const avatars = named as [TeamInviteAvatar, TeamInviteAvatar, TeamInviteAvatar];
    await act(async () =>
      root.render(React.createElement(TeamInvite, { avatars, className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", ref } as React.ComponentProps<typeof TeamInvite>)),
    );
    await settle();
    const el = host.querySelector<TcTeamInvite>("tc-team-invite")!;
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.ui).toBe("ti");
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    expect(ref.current).toBe(el);
    expect(el.querySelectorAll("img")).toHaveLength(3);
    await act(async () => root.unmount());
  });

  test("axe: no violations, described and decorative", async () => {
    const wrap = await fixture(html`<div>
      <tc-team-invite .avatars=${named}></tc-team-invite>
      <tc-team-invite .avatars=${unnamed}></tc-team-invite>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
