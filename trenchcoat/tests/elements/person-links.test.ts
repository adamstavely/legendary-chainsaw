/*
 * <tc-person-links> in real browsers: the rows, roles, second lines, tags and strengths, the count and network
 * action, selecting a person, the listbox keyboard, "Show all", controlled use, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/person-links";
import type { LinkedPerson, PersonLinksSelectedChange, TcPersonLinks } from "../../src/elements/person-links";
import { PersonLinks } from "../../src/elements/react/person-links";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const PEOPLE: LinkedPerson[] = [
  { id: "p1", name: "Dana Whitfield", role: "Director", detail: "CUS-40218", strength: "strong", tag: { label: "Key link", tone: "danger" } },
  { id: "p2", name: "Omar Haddad", role: "Beneficial owner", strength: "strong" },
  { id: "p3", name: "Priya Natarajan", role: "Co-signer", detail: "CUS-40377", strength: "medium" },
  { id: "p4", name: "Tomás Ibáñez", detail: "Ibáñez & Co.", strength: "weak" },
  { id: "p5", name: "Kwame Mensah", role: "Shared address" },
];
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-id="${id}"]`)!;
const ids = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="option"]')].map((r) => r.dataset.id);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcPersonLinks>(html`<tc-person-links look=${look} network-label="View network" .people=${PEOPLE}></tc-person-links>`);

describe("tc-person-links", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a listbox of people with roles, second lines, tags and strengths in words and bars`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("plk");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector('[role="listbox"]')!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Linked people");
      expect(ids(el)).toEqual(["p1", "p2", "p3", "p4", "p5"]);
      expect(list.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(row(el, "p1").getAttribute("tabindex")).toBe("0");
      expect(row(el, "p1").querySelector(".ui-plk__avatar")!.textContent).toBe("DW");
      expect(row(el, "p1").querySelector(".ui-plk__tag")!.textContent).toBe("Key link");
      const strength = (id: string) => row(el, id).querySelector<HTMLElement>(".ui-plk__strength")!;
      expect(["p1", "p3", "p4", "p5"].map((id) => [strength(id).dataset.strength, strength(id).textContent!.trim(), strength(id).querySelectorAll("[data-on]").length])).toEqual([
        ["strong", "Strong", 3],
        ["medium", "Medium", 2],
        ["weak", "Weak", 1],
        ["unknown", "Unknown", 0],
      ]);
      // The second line: the role, then the detail; either alone
      expect(row(el, "p3").querySelector(".ui-plk__line")!.textContent).toBe("Co-signerCUS-40377");
      expect(row(el, "p4").querySelector(".ui-plk__line")!.textContent).toBe("Ibáñez & Co.");
      expect(row(el, "p3").querySelector(".ui-plk__sr")!.textContent).toBe(", Co-signer · CUS-40377, Medium link");
      expect(el.querySelector(".ui-plk__count")!.textContent).toBe("5 linked");
    });
  }

  test("the network action fires tc-action; strength labels can be renamed", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-action", (e) => seen.push((e as CustomEvent).detail));
    el.querySelector<HTMLButtonElement>(".ui-plk__network")!.click();
    expect(seen).toEqual([{ id: "network" }]);
    el.strengthLabels = { strong: "Confirmed", unknown: "Not assessed" };
    el.networkLabel = undefined;
    await settle();
    expect(row(el, "p1").querySelector(".ui-plk__strength")!.textContent!.trim()).toBe("Confirmed");
    expect(row(el, "p5").querySelector(".ui-plk__strength")!.textContent!.trim()).toBe("Not assessed");
    expect(row(el, "p3").querySelector(".ui-plk__strength")!.textContent!.trim()).toBe("Medium");
    expect(el.querySelector(".ui-plk__network")).toBeNull();
  });

  test("click or Enter selects a person; again or Escape clears; tc-selected-change fires with the person", async () => {
    const el = await make();
    const seen: (string | null)[] = [];
    el.addEventListener("tc-selected-change", (e) => {
      const d = (e as CustomEvent<PersonLinksSelectedChange>).detail;
      seen.push(d.selected === null ? null : `${d.selected}:${d.person?.name}`);
    });
    row(el, "p3").click();
    await settle();
    expect(el.selected).toBe("p3");
    expect(row(el, "p3").getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Selected Priya Natarajan");
    key(row(el, "p3"), "Enter");
    await settle();
    expect(el.selected).toBeNull();
    key(row(el, "p2"), " ");
    await settle();
    key(row(el, "p2"), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Selection cleared");
    expect(seen).toEqual(["p3:Priya Natarajan", null, "p2:Omar Haddad", null]);
  });

  test("keyboard: ↑ ↓ Home End move a roving tab stop", async () => {
    const el = await make();
    const at = () => (document.activeElement as HTMLElement | null)?.dataset.id;
    row(el, "p1").focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('[role="option"][tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowDown");
    expect(at()).toBe("p2");
    await press("ArrowUp");
    await press("ArrowUp");
    expect(at()).toBe("p1");
    await press("End");
    expect(at()).toBe("p5");
    await press("ArrowDown");
    expect(at()).toBe("p5");
    await press("Home");
    expect(at()).toBe("p1");
    expect(row(el, "p1").getAttribute("tabindex")).toBe("0");
  });

  test("max: shows the first rows and a Show all button that reveals and hides the rest", async () => {
    const el = await make();
    el.max = 3;
    await settle();
    expect(ids(el)).toEqual(["p1", "p2", "p3"]);
    const more = el.querySelector<HTMLButtonElement>(".ui-plk__more")!;
    expect(more.textContent!.replace(/\s+/g, " ").trim()).toBe("Show all 5+2");
    expect(more.getAttribute("aria-expanded")).toBe("false");
    expect(more.getAttribute("aria-controls")).toBe(el.querySelector('[role="listbox"]')!.id);
    more.click();
    await settle();
    expect(ids(el)).toEqual(["p1", "p2", "p3", "p4", "p5"]);
    expect(el.expanded).toBe(true);
    expect(el.hasAttribute("expanded")).toBe(true);
    expect(more.textContent!.trim()).toBe("Show fewer");
    // A selected person out of view keeps the selection, and the tab stop falls back to a row in view
    row(el, "p5").click();
    await settle();
    more.click();
    await settle();
    expect(ids(el)).toEqual(["p1", "p2", "p3"]);
    expect(el.selected).toBe("p5");
    expect(el.querySelectorAll('[role="option"][tabindex="0"]')).toHaveLength(1);
    el.max = 10;
    await settle();
    expect(el.querySelector(".ui-plk__more")).toBeNull();
  });

  test("controlled: preventDefault() keeps the selection; a selected person who goes away clears it; empty renders", async () => {
    const el = await make();
    el.selected = "p2";
    await settle();
    expect(row(el, "p2").getAttribute("tabindex")).toBe("0");
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    row(el, "p4").click();
    await settle();
    expect(el.selected).toBe("p2");
    el.people = PEOPLE.filter((p) => p.id !== "p2");
    await settle();
    expect(el.selected).toBeNull();
    el.people = [];
    await settle();
    expect(el.querySelector(".ui-plk__empty")).toBeTruthy();
    expect(el.querySelector('[role="listbox"]')).toBeNull();
    expect(el.querySelector(".ui-plk__count")!.textContent).toBe("0 linked");
  });

  test("React wrapper: an uncontrolled selection survives parent re-renders; onSelectedChange gets the person; onNetwork", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(PersonLinks, {
        title: "Related parties",
        people: PEOPLE,
        networkLabel: "View network",
        onSelectedChange: (s, p) => void seen.push([s, p?.name]),
        onNetwork: () => void seen.push("network"),
        "data-n": n,
      } as React.ComponentProps<typeof PersonLinks>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-person-links")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Related parties");
    row(el, "p2").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("p2");
    el.querySelector<HTMLButtonElement>(".ui-plk__network")!.click();
    expect(seen).toEqual([["p2", "Omar Haddad"], "network"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled selection stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: (string | null)[] = [];
    await act(async () => root.render(React.createElement(PersonLinks, { people: PEOPLE, selected: null, onSelectedChange: (s) => void asked.push(s) })));
    await settle();
    const el = host.querySelector("tc-person-links")!;
    row(el, "p1").click();
    await settle();
    expect(asked).toEqual(["p1"]);
    expect(el.selected).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-person-links description="Larkspur Trading Ltd" network-label="View network" max="3" .people=${[...PEOPLE, { id: "p6", name: "Ana Lima", role: "Guarantor", strength: "medium", tag: { label: "Check", tone: "warning" } }]} selected="p2"></tc-person-links>
        <tc-person-links look="clean" .people=${PEOPLE.map((p, i) => (i === 1 ? { ...p, tag: { label: "Verified", tone: "success" as const } } : i === 2 ? { ...p, tag: { label: "New", tone: "info" as const } } : p))}></tc-person-links>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
