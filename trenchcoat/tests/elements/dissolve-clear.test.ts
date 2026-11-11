/* <tc-dissolve-clear> in real browsers: the button follows the input's text, clearing (button and Escape) empties it
 * at once with an input event and focus kept, the dissolving copy cleans itself up, the cancelable event, React, and
 * axe in both themes. */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { TcDissolveClear } from "../../src/elements/dissolve-clear";
import { DissolveClear } from "../../src/elements/react/dissolve-clear";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const search = (value = "vendor tax IDs") =>
  fixture<TcDissolveClear>(html`<tc-dissolve-clear><input type="search" aria-label="Search findings" placeholder="Search findings" .value=${value} /></tc-dissolve-clear>`);
const input = (el: Element) => el.querySelector("input")!;
const clearButton = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-dclr__clear")!;
const visible = (b: Element) => getComputedStyle(b).display !== "none";

describe("tc-dissolve-clear", () => {
  test("the clear button shows while there's text, named by clear-label", async () => {
    const el = await search();
    expect(el.dataset.ui).toBe("dclr");
    expect(visible(clearButton(el))).toBe(true);
    expect(clearButton(el).textContent!.trim()).toBe("Clear");
    input(el).value = "";
    expect(visible(clearButton(el))).toBe(false);
  });

  test("an input without a placeholder gets a blank one, so the button still follows it", async () => {
    const el = await fixture<TcDissolveClear>(html`<tc-dissolve-clear><input aria-label="Name" .value=${""} /></tc-dissolve-clear>`);
    expect(input(el).getAttribute("placeholder")).toBe(" ");
    expect(visible(clearButton(el))).toBe(false);
  });

  test("clearing empties the input at once with input and change events, keeps focus, announces, and the copy goes", async () => {
    const el = await search();
    const events: string[] = [];
    input(el).addEventListener("input", () => events.push("input"));
    input(el).addEventListener("change", () => events.push("change"));
    const seen: string[] = [];
    el.addEventListener("tc-clear", (e) => seen.push((e as CustomEvent<{ value: string }>).detail.value));
    input(el).focus();
    await userEvent.click(clearButton(el));
    await settle();
    expect(input(el).value).toBe("");
    expect(events).toEqual(["input", "change"]);
    expect(seen).toEqual(["vendor tax IDs"]);
    expect(document.activeElement).toBe(input(el));
    expect(visible(clearButton(el))).toBe(false);
    await expect.poll(() => el.querySelector("[role='status']")!.textContent).toBe("Cleared");
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const ghost = el.querySelector(".ui-dclr__ghost")!;
      expect(ghost.getAttribute("aria-hidden")).toBe("true");
      expect(ghost.textContent).toBe("vendor tax IDs");
      expect(el.querySelectorAll(".ui-dclr__letter")).toHaveLength(14);
    }
    await finish(el);
    await expect.poll(() => el.querySelector(".ui-dclr__ghost")).toBeNull();
    expect(el.hasAttribute("data-dissolving")).toBe(false);
  });

  test("Escape in the input clears it; preventDefault on tc-clear keeps the text", async () => {
    const el = await search("case FR-2041");
    input(el).focus();
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(input(el).value).toBe("");
    await finish(el);
    await expect.poll(() => el.querySelector(".ui-dclr__ghost")).toBeNull();
    input(el).value = "keep me";
    el.addEventListener("tc-clear", (e) => e.preventDefault(), { once: true });
    el.clear();
    await settle();
    expect(input(el).value).toBe("keep me");
    expect(el.querySelector(".ui-dclr__ghost")).toBeNull();
  });

  test("React wrapper: a controlled input sees the clear through onChange; onClear can refuse", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const cleared: string[] = [];
    let refuse = false;
    let latest = "";
    function App() {
      const [q, setQ] = React.useState("duplicate IDs");
      latest = q;
      return React.createElement(
        DissolveClear,
        { onClear: (v: string) => { cleared.push(v); return refuse ? false : undefined; } },
        React.createElement("input", { "aria-label": "Search", placeholder: "Search", value: q, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value) }),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-dissolve-clear")!;
    refuse = true;
    await act(async () => el.clear());
    expect(latest).toBe("duplicate IDs");
    refuse = false;
    await act(async () => el.clear());
    await settle();
    expect(latest).toBe("");
    expect(el.querySelector("input")!.value).toBe("");
    expect(cleared).toEqual(["duplicate IDs", "duplicate IDs"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations, with and without text`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); display: grid; gap: 12px; width: 280px">
        <tc-dissolve-clear><input type="search" aria-label="Search findings" placeholder="Search findings" .value=${"vendor IDs"} /></tc-dissolve-clear>
        <tc-dissolve-clear clear-label="Clear name"><input aria-label="Name" placeholder="Name" /></tc-dissolve-clear>
      </div>`);
      await finish(wrap);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    });
  }
});
