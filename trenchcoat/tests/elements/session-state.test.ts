/*
 * <tc-session-state> in real browsers: the health pill, the default tiles from goal / loops / artifacts / pressure,
 * the meter's levels, the page's own tiles, chips, actionable tiles with a roving tab stop, the React wrapper and
 * axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/session-state";
import type { SessionAction, SessionChip, TcSessionState } from "../../src/elements/session-state";
import { SessionState } from "../../src/elements/react/session-state";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const CHIPS: SessionChip[] = [
  { id: "intent", label: "Intent stable", tone: "violet" },
  { id: "approvals", label: "No approval blocked" },
  { id: "files", label: "2 files in context", tone: "teal", action: true },
  { id: "assumptions", label: "1 inferred assumption", tone: "warning" },
];
const LOOPS = ["prototype", "naming", "integration"];
const ARTIFACTS = ["demo", "TSX starter"];

const make = (look: "standard" | "clean" = "standard", actionable = false) =>
  fixture<TcSessionState>(
    html`<tc-session-state look=${look} description="Where we are." health="healthy" goal="Expand the kit" pressure="0.68" ?actionable=${actionable} .loops=${LOOPS} .artifacts=${ARTIFACTS} .chips=${CHIPS}></tc-session-state>`,
  );
const tiles = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-sst__tile")];
const text = (n: Element) => n.textContent!.replace(/\s+/g, " ").trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-session-state", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the health pill, the four default tiles and the chips`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("sst");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Session state");
      const pill = el.querySelector<HTMLElement>(".ui-sst__health")!;
      expect(text(pill)).toBe("Healthy");
      expect(pill.dataset.tone).toBe("success");
      expect(pill.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
      expect(tiles(el).map((t) => t.dataset.id)).toEqual(["goal", "loops", "artifacts", "pressure"]);
      expect(text(tiles(el)[0])).toBe("1 Primary goal Expand the kit");
      expect(text(tiles(el)[1])).toBe("3 Open loops prototype · naming · integration");
      expect(text(tiles(el)[2])).toBe("2 Pending artifacts demo + TSX starter");
      expect(tiles(el)[3].querySelector(".ui-sst__value")!.textContent).toMatch(/^68\s?%$/);
      expect([...el.querySelectorAll<HTMLElement>(".ui-sst__chip")].map((c) => [c.textContent, c.dataset.tone, c.tagName])).toEqual([
        ["Intent stable", "violet", "SPAN"],
        ["No approval blocked", "neutral", "SPAN"],
        ["2 files in context", "teal", "BUTTON"],
        ["1 inferred assumption", "warning", "SPAN"],
      ]);
      // Not actionable: the tiles aren't buttons
      expect(el.querySelector("button.ui-sst__tile")).toBeNull();
    });
  }

  test("the meter: its fill, and its level in tone and words at warn-at and danger-at", async () => {
    const el = await make();
    const meter = () => el.querySelector<HTMLElement>(".ui-sst__meter")!;
    const words = () => tiles(el)[3].querySelector(".ui-sst__sr")!.textContent;
    expect(meter().dataset.tone).toBe("info");
    expect(meter().getAttribute("aria-hidden")).toBe("true");
    expect(el.querySelector<HTMLElement>(".ui-sst__fill")!.style.inlineSize).toBe("68%");
    expect(words()).toBe(", comfortable");
    el.pressure = 0.8;
    await settle();
    expect([meter().dataset.tone, words()]).toEqual(["warning", ", high"]);
    el.pressure = 0.95;
    await settle();
    expect([meter().dataset.tone, words()]).toEqual(["danger", ", critical"]);
    el.dangerAt = 0.99;
    await settle();
    expect(meter().dataset.tone).toBe("warning");
    // Out of range is clamped; unset leaves the tile out
    el.pressure = 1.4;
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-sst__fill")!.style.inlineSize).toBe("100%");
    el.pressure = undefined;
    await settle();
    expect(tiles(el).map((t) => t.dataset.id)).toEqual(["goal", "loops", "artifacts"]);
  });

  test("health: each state has its word and tone, the names can change, and unset hides the pill", async () => {
    const el = await make();
    const pill = () => el.querySelector<HTMLElement>(".ui-sst__health");
    for (const [h, word, tone] of [
      ["drifting", "Drifting", "warning"],
      ["at-risk", "At risk", "danger"],
      ["stalled", "Stalled", "neutral"],
    ] as const) {
      el.health = h;
      await settle();
      expect([text(pill()!), pill()!.dataset.tone]).toEqual([word, tone]);
    }
    el.healthLabels = { stalled: "Idle" };
    await settle();
    expect(text(pill()!)).toBe("Idle");
    el.health = undefined;
    await settle();
    expect(pill()).toBeNull();
  });

  test("the page's own tiles replace the defaults; empty loops read as a zero with no detail", async () => {
    const el = await make();
    el.loops = [];
    await settle();
    expect(text(tiles(el)[1])).toBe("0 Open loops");
    el.tiles = [
      { id: "turns", label: "Turns", value: 142 },
      { id: "budget", label: "Budget used", value: "92%", meter: 0.92, detail: "$46 of $50" },
    ];
    await settle();
    expect(tiles(el).map((t) => t.dataset.id)).toEqual(["turns", "budget"]);
    expect(el.querySelector<HTMLElement>(".ui-sst__meter")!.dataset.tone).toBe("danger");
  });

  test("actionable: tiles are buttons with one tab stop; arrows, Home and End move; Enter and clicks fire tc-action", async () => {
    const el = await make("standard", true);
    const seen: SessionAction[] = [];
    el.addEventListener("tc-action", (e) => seen.push((e as CustomEvent<SessionAction>).detail));
    const buttons = () => [...el.querySelectorAll<HTMLButtonElement>("button.ui-sst__tile")];
    expect(buttons()).toHaveLength(4);
    expect(buttons().filter((b) => b.tabIndex === 0)).toHaveLength(1);
    buttons()[0].focus();
    key(buttons()[0], "ArrowRight");
    await expect.poll(() => document.activeElement?.getAttribute("data-id")).toBe("loops");
    key(document.activeElement!, "End");
    await expect.poll(() => document.activeElement?.getAttribute("data-id")).toBe("pressure");
    key(document.activeElement!, "ArrowRight");
    await settle();
    expect(document.activeElement?.getAttribute("data-id")).toBe("pressure");
    key(document.activeElement!, "Home");
    await expect.poll(() => document.activeElement?.getAttribute("data-id")).toBe("goal");
    expect(buttons().filter((b) => b.tabIndex === 0).map((b) => b.dataset.id)).toEqual(["goal"]);
    buttons()[1].click();
    el.querySelector<HTMLButtonElement>("button.ui-sst__chip")!.click();
    expect(seen).toEqual([
      { id: "loops", kind: "tile" },
      { id: "files", kind: "chip" },
    ]);
  });

  test("React wrapper: the title and onAction", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    await act(async () =>
      root.render(React.createElement(SessionState, { title: "Where are we?", goal: "Ship it", loops: LOOPS, chips: CHIPS, actionable: true, onAction: (id, kind) => void seen.push([id, kind]) })),
    );
    await settle();
    const el = host.querySelector("tc-session-state")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Where are we?");
    el.querySelector<HTMLButtonElement>('button.ui-sst__tile[data-id="loops"]')!.click();
    expect(seen).toEqual([["loops", "tile"]]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-session-state description="Where we are." health="drifting" goal="Expand the kit" pressure="0.8" actionable .loops=${LOOPS} .artifacts=${ARTIFACTS} .chips=${CHIPS}></tc-session-state>
        <tc-session-state look="clean" health="at-risk" goal="Expand the kit" pressure="0.95" .loops=${LOOPS} .chips=${CHIPS}></tc-session-state>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
