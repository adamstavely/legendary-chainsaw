/*
 * <tc-handoff> in real browsers: the three states, the checklist and note, the events and controlled use, focus,
 * the keyboard, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/handoff";
import type { HandoffCheckedChange, HandoffItem, HandoffNoteChange, HandoffReturn, HandoffStatusChange, TcHandoff } from "../../src/elements/handoff";
import { Handoff } from "../../src/elements/react/handoff";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const agent = { name: "Scout" };
const done: HandoffItem[] = ["a", "b", "c", "d", "e"].map((id, i) => ({ id, label: `Step ${id}`, meta: i === 0 ? "14 fares" : undefined }));
const needs: HandoffItem[] = [
  { id: "signin", label: "Sign in" },
  { id: "seats", label: "Check the seats" },
];
const button = (el: Element, name: RegExp) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => name.test(b.textContent!.trim()))!;
const boxes = (el: Element) => [...el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const make = (look: "standard" | "clean" = "standard", extra: Partial<TcHandoff> = {}) =>
  fixture<TcHandoff>(html`<tc-handoff
    look=${look}
    .agent=${agent}
    ask="sign in to TAP Air"
    task="Book flights"
    step="Step 4 of 7"
    blocker="Sign-in required"
    reason="The airline texts a code."
    .done=${done}
    .needs=${needs}
    .status=${extra.status ?? "waiting"}
    .checked=${extra.checked ?? []}
    .note=${extra.note ?? ""}
  ></tc-handoff>`);
const finish = async (root: Element) => {
  for (const a of root.getAnimations?.({ subtree: true }) ?? []) a.finish();
  await settle();
};

describe("tc-handoff", () => {
  test("the host is the root: a group named by its heading and described by the reason", async () => {
    const el = await make();
    expect(el.dataset.ui).toBe("hand");
    expect(el.dataset.look).toBe("standard");
    expect(el.dataset.status).toBe("waiting");
    expect(el.getAttribute("role")).toBe("group");
    expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Scout needs you to sign in to TAP Air");
    expect(document.getElementById(el.getAttribute("aria-describedby")!)!.textContent).toBe("The airline texts a code.");
    expect(el.querySelector(".ui-hand__sub")!.textContent).toBe("Step 4 of 7 · Book flights");
    expect(el.querySelector('.ui-hand__pill[data-tone="warning"]')!.textContent).toContain("Sign-in required");
    // A short header above the sentence, the blocker pill at its right
    expect(el.querySelector(".ui-hand__card > .tc-head:first-child h3.tc-head__title")!.textContent).toBe("Handoff");
    expect(el.querySelector('.tc-head__aside > .ui-hand__pill[data-tone="warning"]')).toBeTruthy();
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the look reaches the host, and status follows its property through all three shapes`, async () => {
      const el = await make(look);
      expect(el.dataset.look).toBe(look);
      expect(button(el, /^Take over/)).toBeTruthy();
      expect(boxes(el)).toHaveLength(0);
      el.status = "active";
      await settle();
      expect(el.dataset.status).toBe("active");
      expect(boxes(el)).toHaveLength(2);
      expect(el.querySelector("textarea")).toBeTruthy();
      expect(button(el, /^Hand back to Scout/)).toBeTruthy();
      expect(el.querySelector(".ui-hand__title")!.textContent).toContain("You have control");
      el.status = "returned";
      await settle();
      expect(el.querySelector(".ui-hand__result-head")!.textContent).toContain("Back with Scout");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.classList.contains("ui-hand__result-head")).toBe(true);
      expect(el.hasAttribute("aria-describedby")).toBe(false);
    });
  }

  test("what it did: N more and Show less; the meta shows", async () => {
    const el = await make();
    const done = () => el.querySelectorAll('.ui-hand__section[data-kind="done"] .ui-hand__item');
    expect(done()).toHaveLength(3);
    expect(el.querySelector(".ui-hand__item-meta")!.textContent).toBe("14 fares");
    const more = el.querySelector<HTMLButtonElement>(".ui-hand__more")!;
    expect(more.textContent).toBe("2 more");
    expect(more.getAttribute("aria-expanded")).toBe("false");
    more.click();
    await settle();
    expect(done()).toHaveLength(5);
    expect(more.textContent).toBe("Show less");
    el.doneLimit = 10;
    await settle();
    expect(el.querySelector(".ui-hand__more")).toBeNull();
  });

  test("Take over, tick, note, Hand back: the events carry the values; tc-return the result", async () => {
    const el = await make();
    const statuses: HandoffStatusChange[] = [];
    const returns: HandoffReturn[] = [];
    el.addEventListener("tc-status-change", (e) => statuses.push((e as CustomEvent<HandoffStatusChange>).detail));
    el.addEventListener("tc-return", (e) => returns.push((e as CustomEvent<HandoffReturn>).detail));
    button(el, /^Take over/).click();
    await settle();
    expect(statuses[0]).toEqual({ status: "active", previous: "waiting" });
    expect(status(el)).toBe("You have control. Scout is paused.");
    expect(el.querySelector(".ui-hand__count[data-progress]")!.textContent).toBe("0/2");
    boxes(el)[1].click();
    await settle();
    expect(el.checked).toEqual(["seats"]);
    boxes(el)[0].click();
    await settle();
    // In the needs' order
    expect(el.checked).toEqual(["signin", "seats"]);
    expect(el.querySelector(".ui-hand__hint")!.textContent).toBe("All done");
    boxes(el)[0].click();
    await settle();
    expect(el.querySelector(".ui-hand__hint")!.textContent).toBe("1 still open – Scout will see which");
    const field = el.querySelector("textarea")!;
    field.value = "Seats were released, I re-held them";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.note).toBe("Seats were released, I re-held them");
    button(el, /^Hand back/).click();
    await settle();
    expect(returns).toEqual([{ checked: ["seats"], open: ["signin"], note: "Seats were released, I re-held them" }]);
    expect(statuses[1]).toEqual({ status: "returned", previous: "active" });
    expect(el.querySelector(".ui-hand__result-note")!.textContent).toBe("1 of 2 done · your note was passed on");
    expect(status(el)).toBe("Handed back to Scout.");
    button(el, /^Take over\s?again/).click();
    await settle();
    expect(el.status).toBe("active");
  });

  test("controlled: preventDefault() keeps status, checked and note", async () => {
    const el = await make("standard", { status: "active", checked: ["signin"], note: "hi" });
    const seen: unknown[] = [];
    for (const name of ["tc-status-change", "tc-checked-change", "tc-note-change"]) {
      el.addEventListener(name, (e) => {
        e.preventDefault();
        seen.push((e as CustomEvent<HandoffCheckedChange | HandoffNoteChange | HandoffStatusChange>).detail);
      });
    }
    boxes(el)[1].click();
    await settle();
    expect(seen[0]).toEqual({ checked: ["signin", "seats"] });
    expect(el.checked).toEqual(["signin"]);
    expect(boxes(el)[1].checked).toBe(false);
    const field = el.querySelector("textarea")!;
    field.value = "hix";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(seen[1]).toEqual({ note: "hix" });
    expect(field.value).toBe("hi");
    button(el, /^Hand back/).click();
    await settle();
    expect(seen[2]).toEqual({ status: "returned", previous: "active" });
    expect(el.dataset.status).toBe("active");
    // The page passes the value back
    el.status = "returned";
    await settle();
    expect(el.dataset.status).toBe("returned");
  });

  test("keyboard: ⌘/Ctrl+Enter takes over and hands back; plain Enter doesn't", async () => {
    const el = await make();
    const card = el.querySelector(".ui-hand__card")!;
    key(card, "Enter");
    await settle();
    expect(el.status).toBe("waiting");
    key(card, "Enter", { metaKey: true });
    await settle();
    expect(el.status).toBe("active");
    key(el.querySelector("textarea")!, "Enter", { ctrlKey: true });
    await settle();
    expect(el.status).toBe("returned");
    // Nothing to do once it's back
    key(el.querySelector(".ui-hand__card")!, "Enter", { metaKey: true });
    await settle();
    expect(el.status).toBe("returned");
    expect(button(el, /^Take over\s?again/).getAttribute("aria-keyshortcuts")).toBeNull();
  });

  test("focus follows the shape: the first open need after Take over, the main button after Hand back", async () => {
    const el = await make("standard", { checked: ["signin"] });
    button(el, /^Take over/).focus();
    button(el, /^Take over/).click();
    await settle();
    await new Promise((r) => requestAnimationFrame(r));
    expect(document.activeElement).toBe(boxes(el)[1]);
    button(el, /^Hand back/).focus();
    button(el, /^Hand back/).click();
    await settle();
    expect(document.activeElement).toBe(button(el, /^Take over\s?again/));
    button(el, /^Take over\s?again/).click();
    await settle();
    expect(document.activeElement).toBe(boxes(el)[1]);
  });

  test("focus stays in the card when a controlling page keeps the status", async () => {
    const el = await make();
    el.addEventListener("tc-status-change", (e) => e.preventDefault());
    const take = button(el, /^Take over/);
    take.focus();
    take.click();
    await settle();
    await new Promise((r) => requestAnimationFrame(r));
    expect(document.activeElement).toBe(button(el, /^Take over/));
  });

  test("ignores ticks of ids that aren't needs; avatar is cloned; no blocker, no pill", async () => {
    const avatar = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    avatar.setAttribute("data-avatar", "");
    const el = await fixture<TcHandoff>(html`<tc-handoff .agent=${{ name: "Scout", avatar }} ask="look" status="returned" .needs=${needs} .checked=${["gone", "seats"]}></tc-handoff>`);
    expect(el.querySelector(".ui-hand__result-note")!.textContent).toBe("1 of 2 done");
    el.status = "waiting";
    await settle();
    expect(el.querySelector(".ui-hand__avatar svg[data-avatar]")).toBeTruthy();
    expect(avatar.isConnected).toBe(false);
    expect(el.querySelector(".ui-hand__pill")).toBeNull();
  });

  test("an empty element renders without errors", async () => {
    const el = await fixture<TcHandoff>(html`<tc-handoff></tc-handoff>`);
    expect(el.querySelector(".ui-hand__card")).toBeTruthy();
    expect(el.querySelector(".ui-hand__context")).toBeNull();
  });

  test("React wrapper: uncontrolled status, checks and note survive a parent re-render; callbacks fire", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(Handoff, {
        agent: { name: "Scout", avatar: React.createElement("i", null, "S") },
        ask: "sign in",
        needs,
        onStatusChange: (s) => void seen.push(s),
        onCheckedChange: (c) => void seen.push(c),
        onReturn: (r) => void seen.push(r),
        "data-n": n,
      } as React.ComponentProps<typeof Handoff>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-handoff")!;
    expect(el.querySelector(".ui-hand__avatar i")!.textContent).toBe("S");
    button(el, /^Take over/).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.dataset.status).toBe("active");
    boxes(el)[0].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(boxes(el)[0].checked).toBe(true);
    button(el, /^Hand back/).click();
    await settle();
    expect(seen).toEqual(["active", ["signin"], { checked: ["signin"], open: ["seats"], note: "" }, "returned"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: controlled status stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[] = [];
    await act(async () => root.render(React.createElement(Handoff, { agent, ask: "sign in", status: "waiting", onStatusChange: (s) => void asked.push(s) })));
    await settle();
    const el = host.querySelector("tc-handoff")!;
    button(el, /^Take over/).click();
    await settle();
    expect(asked).toEqual(["active"]);
    expect(el.dataset.status).toBe("waiting");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, in every state`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-handoff .agent=${agent} ask="sign in" task="Book flights" step="Step 4 of 7" blocker="Sign-in required" reason="The airline texts a code." .done=${done} .needs=${needs}></tc-handoff>
        <tc-handoff look="clean" .agent=${agent} ask="sign in" blocker="Sign-in required" reason="The airline texts a code." .done=${done} .needs=${needs}></tc-handoff>
        <tc-handoff status="active" .agent=${agent} ask="sign in" step="Step 4 of 7" .done=${done} .needs=${needs} .checked=${["signin"]}></tc-handoff>
        <tc-handoff look="clean" status="active" .agent=${agent} ask="sign in" .needs=${needs}></tc-handoff>
        <tc-handoff status="returned" .agent=${agent} ask="sign in" .needs=${needs}></tc-handoff>
        <tc-handoff look="clean" status="returned" .agent=${agent} ask="sign in" note="ok"></tc-handoff>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
