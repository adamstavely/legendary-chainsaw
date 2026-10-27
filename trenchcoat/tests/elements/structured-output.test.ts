/*
 * <tc-structured-output> in real browsers: the tolerant parser on text that stops anywhere, the schema check as it
 * arrives, the tree keyboard, folding (controlled), copy as JSON and TypeScript, tc-validate, the wrapper, and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/structured-output";
import type { StructuredOutputSchema, StructuredOutputValidate, TcStructuredOutput } from "../../src/elements/structured-output";
import { StructuredOutput } from "../../src/elements/react/structured-output";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const SCHEMA: StructuredOutputSchema = {
  type: "object",
  required: ["name", "age", "tags"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 2, description: "Full name" },
    age: { type: "integer", minimum: 0, maximum: 130 },
    role: { type: "string", enum: ["admin", "member"] },
    email: { type: "string", pattern: "^\\S+@\\S+$" },
    tags: { type: "array", maxItems: 2, items: { type: "string" } },
    address: { type: "object", required: ["city"], properties: { city: { type: "string" } } },
  },
};

const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="treeitem"]')];
const rowText = (r: Element) => r.querySelector(".ui-so__line")!.textContent!.replace(/\s+/g, " ").trim();
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-so__row[data-id="${id}"]`)!;
const issueText = (r: Element) => [...r.querySelectorAll(".ui-so__issue")].map((i) => i.textContent!.trim());
const press = (target: Element, key: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

async function make(text: string, opts: { schema?: StructuredOutputSchema; streaming?: boolean; look?: string } = {}) {
  return fixture<TcStructuredOutput>(html`<tc-structured-output look=${opts.look ?? "standard"} .text=${text} .schema=${opts.schema} ?streaming=${!!opts.streaming}></tc-structured-output>`);
}

describe("tc-structured-output", () => {
  test("the host is the root, in either look; the tree is named by the heading", async () => {
    for (const look of ["standard", "clean"]) {
      const el = await make(`{"a":1}`, { look });
      expect(el.dataset.ui).toBe("so");
      expect(el.dataset.look).toBe(look);
      const tree = el.querySelector('[role="tree"]')!;
      expect(document.getElementById(tree.getAttribute("aria-labelledby")!)!.textContent).toBe("Output");
      el.heading = "Ticket";
      await settle();
      expect(document.getElementById(tree.getAttribute("aria-labelledby")!)!.textContent).toBe("Ticket");
      // Clean puts the head inside the card
      expect(!!el.querySelector(".ui-so__card > .ui-so__head")).toBe(look === "clean");
    }
  });

  test("text that stops anywhere still shows: an open string, a key waiting for its value, a half-typed literal", async () => {
    const el = await make(`{"name": "Ma`, { streaming: true });
    expect(rows(el).map(rowText)).toEqual([`name: “Ma string`]);
    expect(el.querySelector(".ui-so__caret")).toBeTruthy();
    expect(el.value).toEqual({ name: "Ma" });
    el.text = `{"name": "Maya", "admin": tr`;
    await settle();
    expect(rows(el).map(rowText)).toEqual([`name: “Maya” string`, "admin: tr boolean"]);
    expect(el.value).toEqual({ name: "Maya" });
    el.text = `{"name": "Maya", "admin": true, "tags"`;
    await settle();
    expect(rowText(rows(el)[2])).toBe("tags: …");
    el.text = `{"name": "Maya", "admin": true, "tags": ["a", {"x": 1`;
    await settle();
    expect(rows(el).map(rowText)).toEqual([`name: “Maya” string`, "admin: true boolean", "tags: [ 2 items ] array", `0 “a” string`, "1 { 1 field } object", "x: 1 number"]);
    expect(el.complete).toBe(false);
    expect(el.querySelector(".ui-so__status")!.textContent).toBe("Writing");
  });

  test("escapes, numbers and nesting parse as JSON does", async () => {
    const src = `{"s": "a\\"b\\n\\u00e9", "n": -1.5e3, "z": null, "list": [1, [2, 3]], "o": {}}`;
    const el = await make(src);
    expect(el.value).toEqual(JSON.parse(src));
    expect(el.complete).toBe(true);
    expect(el.syntaxError).toBe(null);
  });

  test("a Markdown fence around the JSON is ignored", async () => {
    const el = await make("```json\n{\"a\": 1}\n```");
    expect(el.value).toEqual({ a: 1 });
    expect(el.syntaxError).toBe(null);
  });

  test("broken JSON keeps what parsed and says where it stopped", async () => {
    const el = await make(`{\n  "a": 1,\n  "b" 2\n}`);
    expect(el.value).toEqual({ a: 1 });
    expect(el.syntaxError).toEqual({ message: "Expected a colon after the field name", line: 3, column: 7 });
    expect(el.querySelector(".ui-so__status")!.textContent).toBe("Not valid JSON");
    expect(el.querySelector(".ui-so__note")!.textContent).toContain("Stopped reading at line 3, column 7 – expected a colon after the field name.");
  });

  test("output that ends early is incomplete, not an error", async () => {
    const el = await make(`{"a": [1, 2`);
    expect(el.syntaxError).toBe(null);
    expect(el.complete).toBe(false);
    expect(el.querySelector(".ui-so__status")!.textContent).toBe("Incomplete");
    expect(el.querySelector('.ui-so__note[data-tone="warning"]')!.textContent).toContain("ended before the JSON was complete");
  });

  test("the schema flags invalid fields on their rows, with the reason", async () => {
    const el = await make(`{"name": "M", "age": 12.5, "role": "owner", "email": "nope", "tags": ["a", "b", 3], "extra": 1}`, { schema: SCHEMA });
    expect(issueText(row(el, "/name"))).toEqual(["Must be at least 2 characters"]);
    expect(issueText(row(el, "/age"))).toEqual(["Expected a whole number, got a number"]);
    expect(issueText(row(el, "/role"))).toEqual([`Expected one of "admin", "member"`]);
    expect(issueText(row(el, "/email"))).toEqual(["Doesn't match the pattern ^\\S+@\\S+$"]);
    expect(issueText(row(el, "/tags"))).toEqual(["Allows 2 items at most (it has 3)"]);
    expect(issueText(row(el, "/tags/2"))).toEqual(["Expected a string, got a number"]);
    expect(issueText(row(el, "/extra"))).toEqual(["Not in the schema"]);
    expect(row(el, "/name").dataset.state).toBe("invalid");
    expect(el.issues).toHaveLength(7);
    expect(el.querySelector(".ui-so__status")!.textContent).toBe("7 issues");
    // The field's description is its tooltip
    expect(row(el, "/name").querySelector(".ui-so__key")!.getAttribute("title")).toBe("Full name");
  });

  test("ranges and integer type", async () => {
    const el = await make(`{"name": "Ann", "age": -1, "tags": []}`, { schema: SCHEMA });
    expect(issueText(row(el, "/age"))).toEqual(["Must be 0 or more"]);
    expect(row(el, "/age").querySelector(".ui-so__type")!.textContent).toBe("integer");
  });

  test("a required field is flagged missing only once its object has closed", async () => {
    const el = await make(`{"name": "Ann", "address": {"zip": "1"`, { schema: SCHEMA, streaming: true });
    expect(el.querySelector('[data-state="missing"]')).toBe(null);
    el.text = `{"name": "Ann", "address": {"zip": "1"}`;
    await settle();
    const city = row(el, "/address/city");
    expect(city.dataset.state).toBe("missing");
    expect(rowText(city)).toContain("city: Missing – required");
    // The outer object is still open: age and tags aren't missing yet
    expect(el.querySelector('.ui-so__row[data-id="/age"]')).toBe(null);
    el.streaming = false;
    await settle();
    expect(row(el, "/age").dataset.state).toBe("missing");
    expect(row(el, "/tags").dataset.state).toBe("missing");
  });

  test("tc-validate fires when the text settles, and the end is said politely", async () => {
    const seen: StructuredOutputValidate[] = [];
    const wrap = await fixture<HTMLElement>(html`<div @tc-validate=${(e: CustomEvent<StructuredOutputValidate>) => seen.push(e.detail)}>
      <tc-structured-output .text=${`{"name": "Ann"`} .schema=${SCHEMA} streaming></tc-structured-output>
    </div>`);
    const el = wrap.querySelector<TcStructuredOutput>("tc-structured-output")!;
    expect(seen).toHaveLength(0);
    el.text = `{"name": "Ann", "age": 30, "tags": ["x"]}`;
    el.streaming = false;
    await settle();
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ valid: true, value: { name: "Ann", age: 30, tags: ["x"] }, issues: [], error: null, complete: true });
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Done – matches the schema");
    expect(el.querySelector(".ui-so__status")!.textContent).toBe("Matches schema");
    // The same result again doesn't fire
    el.requestUpdate("text", "");
    await settle();
    expect(seen).toHaveLength(1);
  });

  test("tree semantics: levels, positions, expanded state, one tab stop", async () => {
    const el = await make(`{"a": {"b": 1, "c": [true]}, "d": "x"}`);
    const [a, b, c, c0, d] = rows(el);
    expect([a, b, c, c0, d].map((r) => r.getAttribute("aria-level"))).toEqual(["1", "2", "2", "3", "1"]);
    expect([a, b, c, c0, d].map((r) => `${r.getAttribute("aria-posinset")}/${r.getAttribute("aria-setsize")}`)).toEqual(["1/2", "1/2", "2/2", "1/1", "2/2"]);
    expect(a.getAttribute("aria-expanded")).toBe("true");
    expect(b.hasAttribute("aria-expanded")).toBe(false);
    expect(rows(el).filter((r) => r.tabIndex === 0)).toEqual([a]);
  });

  test("keyboard: ↑ ↓ Home End move; → ← open, close and go to the parent; Enter toggles; * opens the siblings", async () => {
    const el = await make(`{"a": {"b": 1, "c": [true]}, "d": {"e": 2}}`);
    const focused = () => (document.activeElement as HTMLElement).dataset.id;
    row(el, "/a").focus();
    press(row(el, "/a"), "ArrowDown");
    await settle();
    expect(focused()).toBe("/a/b");
    press(row(el, "/a/b"), "End");
    await settle();
    expect(focused()).toBe("/d/e");
    press(row(el, "/d/e"), "ArrowLeft");
    await settle();
    expect(focused()).toBe("/d");
    press(row(el, "/d"), "ArrowLeft");
    await settle();
    expect(el.collapsed).toEqual(["/d"]);
    expect(row(el, "/d").getAttribute("aria-expanded")).toBe("false");
    expect(el.querySelector('[data-id="/d/e"]')).toBe(null);
    press(row(el, "/d"), "ArrowRight");
    await settle();
    expect(el.collapsed).toEqual([]);
    press(row(el, "/d"), "ArrowRight");
    await settle();
    expect(focused()).toBe("/d/e");
    press(row(el, "/d/e"), "Home");
    await settle();
    expect(focused()).toBe("/a");
    press(row(el, "/a"), "Enter");
    await settle();
    press(row(el, "/a"), "ArrowDown");
    await settle();
    press(row(el, "/d"), " ");
    await settle();
    expect(el.collapsed).toEqual(["/a", "/d"]);
    press(row(el, "/d"), "*");
    await settle();
    expect(el.collapsed).toEqual([]);
    press(row(el, "/d"), "ArrowUp");
    await settle();
    expect(focused()).toBe("/a/c/0");
  });

  test("a folded branch says how many issues it hides", async () => {
    const el = await make(`{"name": "Ann", "age": 3, "tags": [1, 2]}`, { schema: SCHEMA });
    row(el, "/tags").click();
    await settle();
    expect(el.collapsed).toEqual(["/tags"]);
    expect(row(el, "/tags").querySelector(".ui-so__inside")!.textContent!.trim()).toBe("2 issues inside");
    expect(rowText(row(el, "/tags"))).toContain("[ 2 items ]");
  });

  test("controlled folding: preventDefault keeps the value; the app passes it back", async () => {
    const el = await make(`{"a": {"b": 1}}`);
    const asked: string[][] = [];
    el.addEventListener("tc-collapsed-change", (e) => {
      e.preventDefault();
      asked.push((e as CustomEvent).detail.collapsed);
    });
    row(el, "/a").click();
    await settle();
    expect(asked).toEqual([["/a"]]);
    expect(el.collapsed).toEqual([]);
    el.collapsed = ["/a"];
    await settle();
    expect(row(el, "/a").getAttribute("aria-expanded")).toBe("false");
  });

  test("focus stays in the tree when the focused row goes away", async () => {
    const el = await make(`{"a": {"b": 1}, "c": 2}`);
    row(el, "/a/b").focus();
    el.text = `{"c": 2}`;
    await settle();
    await new Promise((r) => setTimeout(r, 0));
    expect(rows(el).filter((r) => r.tabIndex === 0).map((r) => r.dataset.id)).toEqual(["/c"]);
    expect(el.contains(document.activeElement)).toBe(true);
  });

  test("copy as JSON and as a TypeScript literal; a toolbar with one tab stop", async () => {
    const writes: string[] = [];
    if (navigator.clipboard) vi.spyOn(navigator.clipboard, "writeText").mockImplementation(async (t: string) => void writes.push(t));
    else Object.defineProperty(navigator, "clipboard", { value: { writeText: async (t: string) => void writes.push(t) }, configurable: true });
    const el = await make(`{"name": "Ann", "two words": [1, {"ok": true}], "empty": {}}`);
    el.variableName = "person";
    await settle();
    const copies: { format: string; text: string }[] = [];
    el.addEventListener("tc-copy", (e) => copies.push((e as CustomEvent).detail));
    const [json, ts] = [...el.querySelectorAll<HTMLButtonElement>(".ui-so__tool")];
    expect([json.tabIndex, ts.tabIndex]).toEqual([0, -1]);
    json.focus();
    press(json, "ArrowRight");
    expect(document.activeElement).toBe(ts);
    json.click();
    await new Promise((r) => setTimeout(r, 0));
    ts.click();
    await new Promise((r) => setTimeout(r, 0));
    await settle();
    expect(writes[0]).toBe(JSON.stringify({ name: "Ann", "two words": [1, { ok: true }], empty: {} }, null, 2));
    expect(writes[1]).toBe(`const person = {\n  name: "Ann",\n  "two words": [\n    1,\n    {\n      ok: true,\n    },\n  ],\n  empty: {},\n};\n`);
    expect(copies.map((c) => c.format)).toEqual(["json", "ts"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Copied as TypeScript");
    expect(ts.hasAttribute("data-copied")).toBe(true);
  });

  test("nothing to copy before anything arrives; the empty state says what's happening", async () => {
    const el = await make("", { streaming: true });
    expect([...el.querySelectorAll<HTMLButtonElement>(".ui-so__tool")].every((b) => b.disabled)).toBe(true);
    expect(el.querySelector(".ui-so__empty")!.textContent).toBe("Waiting for output…");
    el.streaming = false;
    await settle();
    expect(el.querySelector(".ui-so__empty")!.textContent).toBe("No output yet.");
  });

  test("a scalar root is one row; a wrong root type is a note", async () => {
    const el = await make(`42`, { schema: { type: "string" } });
    expect(rows(el).map(rowText)).toEqual(["42 number"]);
    expect(issueText(rows(el)[0])).toEqual(["Expected a string, got a number"]);
    el.text = "[1]";
    el.schema = { type: "object" };
    await settle();
    expect(el.querySelector(".ui-so__note")!.textContent).toContain("Expected an object, got a list");
  });

  test("timers are cleared on disconnect", async () => {
    if (navigator.clipboard) vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const el = await make(`{"a": 1}`);
    el.querySelector<HTMLButtonElement>(".ui-so__tool")!.click();
    await new Promise((r) => setTimeout(r, 0));
    const clear = vi.spyOn(window, "clearTimeout");
    el.remove();
    expect(clear).toHaveBeenCalled();
  });

  test("React wrapper: title, a folded branch that survives a re-render, onCollapsedChange, onValidate", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onCollapsedChange = vi.fn();
    const onValidate = vi.fn();
    function App() {
      const [n, setN] = React.useState(0);
      return React.createElement(
        "div",
        null,
        React.createElement("button", { onClick: () => setN(n + 1) }, `re-render ${n}`),
        React.createElement(StructuredOutput, { title: "Result", text: `{"a": {"b": 1}}`, onCollapsedChange, onValidate }),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcStructuredOutput>("tc-structured-output")!;
    expect(el.heading).toBe("Result");
    expect(onValidate).toHaveBeenCalledWith(expect.objectContaining({ valid: true, value: { a: { b: 1 } } }));
    await act(async () => row(el, "/a").click());
    await settle();
    expect(onCollapsedChange).toHaveBeenCalledWith(["/a"]);
    await act(async () => host.querySelector("button")!.click());
    await settle();
    expect(el.collapsed).toEqual(["/a"]);
    expect(row(el, "/a").getAttribute("aria-expanded")).toBe("false");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    for (const look of ["standard", "clean"] as const)
      test(`axe: no violations (${look}, ${theme})`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-tc-theme=${theme}>
          <tc-structured-output look=${look} .schema=${SCHEMA} .text=${`{"name": "A", "age": 200, "tags": ["x"], "address": {}}`}></tc-structured-output>
          <tc-structured-output look=${look} heading="Streaming" streaming .text=${`{"name": "Ann", "tags": ["x`}></tc-structured-output>
          <tc-structured-output look=${look} heading="Broken" .text=${`{"a" 1}`}></tc-structured-output>
        </div>`);
        wrap.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity).forEach((a) => a.finish());
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
});
