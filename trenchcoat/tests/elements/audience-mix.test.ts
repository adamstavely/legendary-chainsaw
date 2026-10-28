import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/audience-mix";
import type { AudienceShare, TcAudienceMix } from "../../src/elements/audience-mix";
import { AudienceMix } from "../../src/elements/react/audience-mix";
import { cleanup, finish, fixture, settle } from "./helpers";

/*
 * <tc-audience-mix> in real browsers: groups and their shares from each group's own total, the split, the roving
 * rows and readout, embedded mode, the React wrapper and axe in both looks and both themes.
 */

afterEach(cleanup);

const sectors: AudienceShare[] = [
  { label: "Academic", value: 540 },
  { label: "Industry", value: 230 },
  { label: "Government", value: 140 },
  { label: "Nonprofit", value: 90 },
];
const places: AudienceShare[] = [
  { label: "United States", value: 38 },
  { label: "Japan", value: 12 },
  { label: "Other", value: 50 },
];
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>("[data-row]")];
const readout = (el: Element) => el.querySelector(".ui-audm__readout")!.textContent!.replace(/\s+/g, " ").trim();
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcAudienceMix>(html`<tc-audience-mix look=${look} .sectors=${sectors} .split=${{ internal: 6, external: 94 }} .places=${places}></tc-audience-mix>`);
const runAxe = async (wrap: Element) => {
  await finish(wrap);
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
};
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const react = async (node: React.ReactElement) => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(node));
  await settle();
  return { host, root };
};

describe("tc-audience-mix", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: three groups, each row named with its share from the group's own total, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("audm");
      expect(el.dataset.look).toBe(look);
      expect([...el.querySelectorAll(".ui-audm__group-label")].map((h) => h.textContent)).toEqual(["Sector", "Internal vs external", "Where"]);
      expect(rows(el).map((r) => r.getAttribute("aria-label"))).toEqual([
        "Academic, 54%",
        "Industry, 23%",
        "Government, 14%",
        "Nonprofit, 9%",
        "Internal, 6%",
        "External, 94%",
        "United States, 38%",
        "Japan, 12%",
        "Other, 50%",
      ]);
      expect(el.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(el.querySelector<HTMLElement>(".ui-audm__fill")!.style.inlineSize).toBe("54%");
      expect([...el.querySelectorAll(".ui-audm__split-item")].map((i) => i.textContent!.replace(/\s+/g, " ").trim())).toEqual(["6% internal", "94% external"]);
    });
  }

  test("groups without data are left out; nothing at all shows an empty state", async () => {
    const el = await fixture<TcAudienceMix>(html`<tc-audience-mix .places=${places}></tc-audience-mix>`);
    expect([...el.querySelectorAll(".ui-audm__group")].map((g) => (g as HTMLElement).dataset.group)).toEqual(["place"]);
    el.places = [];
    await settle();
    expect(el.querySelector(".ui-audm__empty")).toBeTruthy();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Who is reading");
  });

  test("arrow keys move across the groups; focus and the pointer drive the readout", async () => {
    const el = await make();
    expect(readout(el)).toBe("Point at a row to see its share");
    rows(el)[0].focus();
    await settle();
    expect(readout(el)).toBe("Academic · 54% of readers");
    const at = () => document.activeElement?.getAttribute("data-row");
    key(rows(el)[0], "ArrowDown");
    await expect.poll(at).toBe("1");
    key(document.activeElement!, "End");
    await expect.poll(at).toBe("8");
    key(document.activeElement!, "ArrowUp");
    await expect.poll(at).toBe("7");
    key(document.activeElement!, "Home");
    await expect.poll(at).toBe("0");
    rows(el)[4].dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(readout(el)).toBe("Internal · 6% of readers");
  });

  test("embedded: no card or header", async () => {
    const el = await fixture<TcAudienceMix>(html`<tc-audience-mix embedded .sectors=${sectors}></tc-audience-mix>`);
    expect(el.querySelector(".tc-head__title")).toBeNull();
    expect(el.querySelector(".ui-audm__card")).toBeNull();
    expect(rows(el)).toHaveLength(4);
  });

  test("React wrapper: the title and the data", async () => {
    const { host, root } = await react(React.createElement(AudienceMix, { title: "Readers", sectors, places }));
    const el = host.querySelector("tc-audience-mix")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Readers");
    expect(rows(el)).toHaveLength(7);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-audience-mix description="First year." .sectors=${sectors} .split=${{ internal: 6, external: 94 }} .places=${places}></tc-audience-mix>
        <tc-audience-mix look="clean" .sectors=${sectors}></tc-audience-mix>
      </div>`);
      expect(await runAxe(wrap)).toEqual([]);
    });
  }
});
