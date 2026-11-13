/*
 * <tc-test-run-panel> in real browsers: the badge and the log, sending (Enter, Shift+Enter, prevented, while busy),
 * tool calls folded into cards, Save as test case, the Variables strip, Reset, the reply announcement, the wrapper,
 * axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/test-run-panel";
import type { TcTestRunPanel, TestRunSaveCase, TestRunSend, TestRunTurn, TestRunVariablesChange } from "../../src/elements/test-run-panel";
import { TestRunPanel } from "../../src/elements/react/test-run-panel";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const TURNS: TestRunTurn[] = [
  { id: "u1", role: "user", text: "Can I claim a taxi from the airport?" },
  {
    id: "a1",
    role: "agent",
    text: "Yes, after 21:00 – section 4.2.",
    tools: [{ id: "t1", name: "search_policy", status: "success", duration: 640, args: { query: "taxi" }, result: { hits: 3 } }],
  },
];
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();
const field = (el: Element) => el.querySelector<HTMLTextAreaElement>(".ui-trp__field")!;
const type = (input: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
};

describe("tc-test-run-panel", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host is the root; the badge, an empty log, a labelled field and Send held back`, async () => {
      const el = await fixture<TcTestRunPanel>(html`<tc-test-run-panel look=${look} agent="Policy QA" version="v14"></tc-test-run-panel>`);
      expect(el.dataset.ui).toBe("trp");
      expect(el.dataset.look).toBe(look);
      expect(getComputedStyle(el).display).toBe("block");
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Test");
      expect(text(el.querySelector(".ui-trp__badge"))).toBe("Testing draft v14");
      const log = el.querySelector(".ui-trp__log")!;
      expect(log.getAttribute("role")).toBe("log");
      expect(log.getAttribute("aria-busy")).toBe("false");
      expect(text(log)).toMatch(/^Send a message to try the agent/);
      const f = field(el);
      expect(el.querySelector<HTMLLabelElement>(`label[for="${f.id}"]`)!.textContent).toBe("Message the agent");
      expect(el.querySelector(".ui-trp__send")!.getAttribute("aria-disabled")).toBe("true");
      expect(el.querySelector(".ui-trp__reset")!.hasAttribute("disabled")).toBe(true);
      el.target = "live";
      await settle();
      expect(text(el.querySelector(".ui-trp__badge"))).toBe("Testing live v14");
    });
  }

  test("Enter sends the text and the variables, and clears the field; Shift+Enter doesn't; prevented, the text stays", async () => {
    const el = await fixture<TcTestRunPanel>(html`<tc-test-run-panel .variables=${[{ key: "region", value: "EU" }]}></tc-test-run-panel>`);
    const sent: TestRunSend[] = [];
    let prevent = false;
    el.addEventListener("tc-send", (e) => {
      sent.push((e as CustomEvent<TestRunSend>).detail);
      if (prevent) e.preventDefault();
    });
    type(field(el), "  Meals on a travel day?  ");
    await settle();
    expect(el.querySelector(".ui-trp__send")!.getAttribute("aria-disabled")).toBe("false");
    key(field(el), "Enter", { shiftKey: true });
    await settle();
    expect(sent).toEqual([]);
    key(field(el), "Enter");
    await settle();
    expect(sent).toEqual([{ text: "Meals on a travel day?", variables: [{ key: "region", value: "EU" }] }]);
    expect(field(el).value).toBe("");
    prevent = true;
    type(field(el), "Again");
    el.querySelector<HTMLButtonElement>(".ui-trp__send")!.click();
    await settle();
    expect(sent).toHaveLength(2);
    expect(field(el).value).toBe("Again");
    // Nothing typed: Send focuses the field and sends nothing
    type(field(el), "   ");
    el.querySelector<HTMLButtonElement>(".ui-trp__send")!.click();
    await settle();
    expect(sent).toHaveLength(2);
    expect(document.activeElement).toBe(field(el));
  });

  test("while a reply streams the log is busy and Send waits; when it finishes, the status says so once", async () => {
    const el = await fixture<TcTestRunPanel>(html`<tc-test-run-panel .turns=${[TURNS[0], { id: "a1", role: "agent", text: "Yes", streaming: true }]}></tc-test-run-panel>`);
    const sent: unknown[] = [];
    el.addEventListener("tc-send", (e) => sent.push(e));
    expect(el.querySelector(".ui-trp__log")!.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelector(".ui-trp__turn[data-role='agent']")!.getAttribute("aria-busy")).toBe("true");
    type(field(el), "Next question");
    await settle();
    const send = el.querySelector<HTMLButtonElement>(".ui-trp__send")!;
    expect(send.getAttribute("aria-disabled")).toBe("true");
    expect(text(document.getElementById(send.getAttribute("aria-describedby")!))).toBe("Waiting for the reply");
    send.click();
    await settle();
    expect(sent).toEqual([]);
    expect(field(el).value).toBe("Next question");
    el.turns = [TURNS[0], { id: "a1", role: "agent", text: "Yes, after 21:00." }];
    await settle();
    expect(el.querySelector(".ui-trp__log")!.getAttribute("aria-busy")).toBe("false");
    expect(text(el.querySelector(':scope > [role="status"]'))).toBe("Agent replied");
  });

  test("turns: who said each, tool calls as cards, an error under a failed reply", async () => {
    const el = await fixture<TcTestRunPanel>(html`<tc-test-run-panel .turns=${[...TURNS, { id: "u2", role: "user", text: "And trains?" }, { id: "a2", role: "agent", text: "", error: "The model timed out" }]}></tc-test-run-panel>`);
    const turns = [...el.querySelectorAll(".ui-trp__turn")];
    expect(turns.map((t) => t.getAttribute("data-role"))).toEqual(["user", "agent", "user", "agent"]);
    expect(turns.map((t) => text(t.querySelector(".ui-trp__who")))).toEqual(["You", "Agent", "You", "Agent"]);
    const card = turns[1].querySelector("tc-tool-call-card")!;
    expect(card.name).toBe("search_policy");
    expect(card.open).toBe(false);
    expect(text(turns[3].querySelector(".ui-trp__error"))).toBe("The model timed out");
    // A failed reply can't be saved; the good one can
    expect(turns[1].querySelector(".ui-trp__save")).not.toBeNull();
    expect(turns[3].querySelector(".ui-trp__save")).toBeNull();
  });

  test("Save as test case carries the reply, the message that asked for it and the variables; prevented, it isn't marked", async () => {
    const el = await fixture<TcTestRunPanel>(html`<tc-test-run-panel .turns=${TURNS} .variables=${[{ key: "grade", value: "Fellow" }]}></tc-test-run-panel>`);
    const saved: TestRunSaveCase[] = [];
    let prevent = true;
    el.addEventListener("tc-save-case", (e) => {
      saved.push((e as CustomEvent<TestRunSaveCase>).detail);
      if (prevent) e.preventDefault();
    });
    el.querySelector<HTMLButtonElement>(".ui-trp__save")!.click();
    await settle();
    expect(saved[0].input).toBe("Can I claim a taxi from the airport?");
    expect(saved[0].turn.id).toBe("a1");
    expect(saved[0].variables).toEqual([{ key: "grade", value: "Fellow" }]);
    expect(el.querySelector(".ui-trp__saved")).toBeNull();
    prevent = false;
    el.querySelector<HTMLButtonElement>(".ui-trp__save")!.click();
    await settle();
    expect(el.saved).toEqual(["a1"]);
    expect(text(el.querySelector(".ui-trp__saved"))).toBe("Saved as a test case");
    expect(text(el.querySelector(':scope > [role="status"]'))).toBe("Saved as a test case");
  });

  test("Variables: a disclosure; add focuses the new name, edits and removes fire tc-variables-change; prevented, nothing changes", async () => {
    const el = await fixture<TcTestRunPanel>(html`<tc-test-run-panel .variables=${[{ key: "region", value: "EU" }]}></tc-test-run-panel>`);
    const changes: TestRunVariablesChange[] = [];
    el.addEventListener("tc-variables-change", (e) => changes.push((e as CustomEvent<TestRunVariablesChange>).detail));
    const toggle = el.querySelector<HTMLButtonElement>(".ui-trp__vars-toggle")!;
    const body = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(body.hidden).toBe(true);
    expect(text(el.querySelector(".ui-trp__vars-peek"))).toBe("region=EU");
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(body.hidden).toBe(false);
    el.querySelector<HTMLButtonElement>(".ui-trp__var-add")!.click();
    await settle();
    const keys = () => [...el.querySelectorAll<HTMLInputElement>(".ui-trp__var-key")];
    expect(keys()).toHaveLength(2);
    expect(document.activeElement).toBe(keys()[1]);
    type(keys()[1], "grade");
    await settle();
    expect(el.variables).toEqual([
      { key: "region", value: "EU" },
      { key: "grade", value: "" },
    ]);
    expect(el.querySelector<HTMLLabelElement>(`label[for="${keys()[1].id}"]`)!.textContent).toBe("Name 2");
    el.addEventListener("tc-variables-change", (e) => e.preventDefault(), { once: true });
    el.querySelectorAll<HTMLButtonElement>(".ui-trp__var-remove")[0].click();
    await settle();
    expect(el.variables).toHaveLength(2);
    el.querySelectorAll<HTMLButtonElement>(".ui-trp__var-remove")[0].click();
    await settle();
    expect(el.variables).toEqual([{ key: "grade", value: "" }]);
    expect(text(el.querySelector(':scope > [role="status"]'))).toBe("Removed region");
    expect(document.activeElement).toBe(el.querySelector(".ui-trp__var-remove"));
    expect(changes.length).toBe(4);
  });

  test("Reset clears the conversation unless prevented, and focus goes to the field", async () => {
    const el = await fixture<TcTestRunPanel>(html`<tc-test-run-panel .turns=${TURNS}></tc-test-run-panel>`);
    const reset = el.querySelector<HTMLButtonElement>(".ui-trp__reset")!;
    expect(reset.disabled).toBe(false);
    el.addEventListener("tc-turns-change", (e) => e.preventDefault(), { once: true });
    reset.click();
    await settle();
    expect(el.turns).toHaveLength(2);
    let seen: unknown = null;
    el.addEventListener("tc-turns-change", (e) => (seen = (e as CustomEvent).detail));
    reset.focus();
    reset.click();
    await settle();
    expect(seen).toEqual({ turns: [] });
    expect(el.turns).toEqual([]);
    expect(document.activeElement).toBe(field(el));
    expect(text(el.querySelector(':scope > [role="status"]'))).toBe("Conversation reset");
  });

  test("renamed labels", async () => {
    const el = await fixture<TcTestRunPanel>(html`<tc-test-run-panel version="v2" .labels=${{ draft: "Proefversie", send: "Versturen" }}></tc-test-run-panel>`);
    expect(text(el.querySelector(".ui-trp__badge"))).toBe("Proefversie v2");
    expect(text(el.querySelector(".ui-trp__send"))).toBe("Versturen");
  });

  test("styles: reduced motion turns motion off; no endless loop; no theme-scoped colours", async () => {
    await fixture(html`<tc-test-run-panel></tc-test-run-panel>`);
    const css = (customElements.get("tc-test-run-panel") as unknown as { css: string }).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    expect(css).not.toMatch(/infinite/);
    expect(css).not.toMatch(/\.dark\b|data-tc-theme="dark"/);
  });

  test("React wrapper: uncontrolled variables survive a re-render; onSend false keeps the text; Reset reaches onTurnsChange", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let keep = true;
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(TestRunPanel, {
        title: "Try it",
        defaultTurns: TURNS,
        defaultVariables: [{ key: "region", value: "EU" }],
        onTurnsChange: (t) => seen.push(["turns", t.length]),
        onVariablesChange: (v) => seen.push(["vars", v.length]),
        onSend: (t) => {
          seen.push(["send", t]);
          return keep ? false : undefined;
        },
        "data-n": n,
      } as React.ComponentProps<typeof TestRunPanel>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-test-run-panel")!;
    expect(el.heading).toBe("Try it");
    el.querySelector<HTMLButtonElement>(".ui-trp__vars-toggle")!.click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-trp__var-add")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.variables).toHaveLength(2);
    type(field(el), "Hi");
    key(field(el), "Enter");
    await settle();
    expect(field(el).value).toBe("Hi");
    keep = false;
    key(field(el), "Enter");
    await settle();
    expect(field(el).value).toBe("");
    el.querySelector<HTMLButtonElement>(".ui-trp__reset")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.turns).toEqual([]);
    expect(seen).toEqual([["vars", 2], ["send", "Hi"], ["send", "Hi"], ["turns", 0]]);
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme – with turns, tool cards, saved, variables open, and empty", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <div style="width: 420px"><tc-test-run-panel agent="Policy QA" version="v14" .turns=${TURNS} .saved=${["a1"]} .variables=${[{ key: "region", value: "EU" }]}></tc-test-run-panel></div>
        <div style="width: 420px"><tc-test-run-panel look="clean" target="live" version="v13" .turns=${[...TURNS, { id: "u2", role: "user", text: "Trains?" }, { id: "a2", role: "agent", text: "Thinking", streaming: true }]}></tc-test-run-panel></div>
        <div style="width: 300px"><tc-test-run-panel look="clean"></tc-test-run-panel></div>
      </div>`);
      wrap.querySelector<HTMLButtonElement>(".ui-trp__vars-toggle")!.click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
